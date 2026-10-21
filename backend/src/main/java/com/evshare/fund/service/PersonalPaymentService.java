package com.evshare.fund.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;
import com.evshare.expense.entity.ExpenseStatus;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.fund.dto.PersonalExpensePaymentResponse;
import com.evshare.fund.dto.PersonalPaymentSubmitRequest;
import com.evshare.fund.dto.PersonalPaymentVerifyRequest;
import com.evshare.fund.entity.PersonalExpensePayment;
import com.evshare.fund.entity.PersonalPaymentStatus;
import com.evshare.fund.repository.PersonalExpensePaymentRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.evshare.fund.config.FinancialModeConfig;
import com.evshare.fund.entity.FinancialMode;

@Service
public class PersonalPaymentService {

    private final PersonalExpensePaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final FinancialModeConfig financialModeConfig;

    public PersonalPaymentService(
            PersonalExpensePaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            ExpenseShareRepository expenseShareRepository,
            FinancialModeConfig financialModeConfig
    ) {
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.expenseShareRepository = expenseShareRepository;
        this.financialModeConfig = financialModeConfig;
    }

    /**
     * Submit payment information for a personal expense obligation (e.g., electricity from a trip)
     * Creates PAYMENT_SUBMITTED record; does NOT settle expense share immediately and NEVER touches Shared Fund.
     */
    @Transactional
    public PersonalExpensePaymentResponse submitPayment(
            UUID expenseId,
            PersonalPaymentSubmitRequest request,
            UserPrincipal principal
    ) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Khoản chi không tồn tại: " + expenseId));

        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new IllegalStateException("Khoản chi chưa được duyệt hợp lệ. Chưa thể thực hiện thanh toán cá nhân.");
        }

        User payer = principal.getUser();

        // Find relevant expense share for this user
        ExpenseShare share = null;
        if (request.expenseShareId() != null) {
            share = expenseShareRepository.findById(request.expenseShareId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân bổ chi phí không tồn tại: " + request.expenseShareId()));
            if (!share.getUser().getId().equals(payer.getId()) && payer.getRole() == Role.CO_OWNER) {
                throw new AccessDeniedException("Bạn không thể thanh toán nghĩa vụ chi phí của thành viên khác.");
            }
        } else {
            share = expenseShareRepository.findByExpenseIdAndUserId(expenseId, payer.getId()).orElse(null);
        }

        if (share != null && share.getStatus() == ExpenseShareStatus.SETTLED) {
            throw new IllegalStateException("Nghĩa vụ chi phí này đã được thanh toán hoàn tất (ĐÃ THANH TOÁN).");
        }

        String paymentRef = request.paymentReference() != null && !request.paymentReference().isBlank()
                ? request.paymentReference().trim()
                : "DEMO-PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PersonalExpensePayment payment = new PersonalExpensePayment(
                UUID.randomUUID(),
                expense,
                share,
                payer,
                request.amount(),
                PersonalPaymentStatus.PAYMENT_SUBMITTED,
                request.paymentMethod() != null ? request.paymentMethod() : "DEMO_PAYMENT",
                paymentRef,
                request.evidenceUrl(),
                request.note() != null ? request.note() : "Thanh toán mô phỏng chi phí điện cá nhân"
        );
        payment.setFinancialMode(financialModeConfig.getMode());

        PersonalExpensePayment saved = paymentRepository.save(payment);
        return mapToPaymentResponse(saved);
    }

    /**
     * Authorized STAFF or ADMIN verifies actual receipt of personal payment funds
     * Marks payment PAYMENT_VERIFIED and settles corresponding ExpenseShare if fully paid
     */
    @Transactional
    public PersonalExpensePaymentResponse verifyPayment(
            UUID paymentId,
            PersonalPaymentVerifyRequest request,
            UserPrincipal principal
    ) {
        if (principal.getUser().getRole() != Role.STAFF && principal.getUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có thẩm quyền xác minh thanh toán.");
        }

        PersonalExpensePayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bản ghi thanh toán không tồn tại: " + paymentId));

        if (payment.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED) {
            throw new DuplicateResourceException("Bản ghi thanh toán này đã được xác minh thành công trước đó.");
        }

        Instant now = Instant.now();
        User verifier = principal.getUser();

        if (Boolean.TRUE.equals(request.confirmed())) {
            payment.setStatus(PersonalPaymentStatus.PAYMENT_VERIFIED);
            payment.setVerifiedAt(now);
            payment.setVerifiedByUser(verifier);
            if (request.note() != null && !request.note().isBlank()) {
                payment.setNote(payment.getNote() + " | Xác minh: " + request.note());
            }

            // Settle ExpenseShare if verified payments satisfy obligation
            ExpenseShare share = payment.getExpenseShare();
            if (share == null) {
                share = expenseShareRepository.findByExpenseIdAndUserId(
                        payment.getExpense().getId(), payment.getPayerUser().getId()).orElse(null);
            }

            if (share != null) {
                // Sum all verified payments for this share
                List<PersonalExpensePayment> allSharePayments = paymentRepository.findByExpenseShareIdOrderByCreatedAtDesc(share.getId());
                BigDecimal totalVerified = allSharePayments.stream()
                        .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED || p.getId().equals(payment.getId()))
                        .map(PersonalExpensePayment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalVerified.compareTo(share.getShareAmount()) >= 0) {
                    share.setStatus(ExpenseShareStatus.SETTLED);
                    expenseShareRepository.save(share);
                }
            }
        } else {
            payment.setStatus(PersonalPaymentStatus.PAYMENT_REJECTED);
            payment.setVerifiedAt(now);
            payment.setVerifiedByUser(verifier);
            if (request.note() != null && !request.note().isBlank()) {
                payment.setNote(payment.getNote() + " | Từ chối: " + request.note());
            }
        }

        PersonalExpensePayment saved = paymentRepository.save(payment);
        return mapToPaymentResponse(saved);
    }

    /**
     * Get payments for a specific expense
     */
    @Transactional(readOnly = true)
    public List<PersonalExpensePaymentResponse> getPaymentsForExpense(UUID expenseId, UserPrincipal principal) {
        return paymentRepository.findByExpenseIdOrderByCreatedAtDesc(expenseId).stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get payments made by the authenticated user
     */
    @Transactional(readOnly = true)
    public List<PersonalExpensePaymentResponse> getPaymentsForCurrentUser(UserPrincipal principal) {
        return paymentRepository.findByPayerUserIdOrderByCreatedAtDesc(principal.getId()).stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get pending payments (PAYMENT_SUBMITTED status), optionally filtered by vehicleId for STAFF/ADMIN verification
     */
    @Transactional(readOnly = true)
    public List<PersonalExpensePaymentResponse> getPendingPayments(UUID vehicleId, UserPrincipal principal) {
        if (principal.getUser().getRole() != Role.STAFF && principal.getUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có thẩm quyền truy cập danh sách thanh toán chờ duyệt.");
        }

        List<PersonalExpensePayment> submitted = paymentRepository.findByStatusOrderByCreatedAtDesc(PersonalPaymentStatus.PAYMENT_SUBMITTED);
        return submitted.stream()
                .filter(p -> {
                    if (vehicleId == null) {
                        return true;
                    }
                    Expense exp = p.getExpense();
                    return exp != null && exp.getVehicle() != null && vehicleId.equals(exp.getVehicle().getId());
                })
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    private PersonalExpensePaymentResponse mapToPaymentResponse(PersonalExpensePayment p) {
        FinancialMode mode = p.getFinancialMode() != null ? p.getFinancialMode() : financialModeConfig.getMode();
        Expense exp = p.getExpense();
        UUID vehicleId = (exp != null && exp.getVehicle() != null) ? exp.getVehicle().getId() : null;
        String vehicleName = (exp != null && exp.getVehicle() != null) ? exp.getVehicle().getName() : null;

        return new PersonalExpensePaymentResponse(
                p.getId(),
                exp != null ? exp.getId() : null,
                exp != null ? exp.getDescription() : null,
                p.getExpenseShare() != null ? p.getExpenseShare().getId() : null,
                p.getPayerUser().getId(),
                p.getPayerUser().getFullName(),
                p.getAmount(),
                p.getStatus(),
                p.getStatus().getVietnameseLabel(),
                p.getPaymentMethod(),
                p.getPaymentReference(),
                p.getEvidenceUrl(),
                p.getNote(),
                p.getCreatedAt(),
                p.getVerifiedAt(),
                p.getVerifiedByUser() != null ? p.getVerifiedByUser().getFullName() : null,
                mode,
                mode.getVietnameseLabel(),
                vehicleId,
                vehicleName
        );
    }
}
