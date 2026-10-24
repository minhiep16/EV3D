package com.evshare.ownership.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.ownership.dto.CreateWithdrawalRequest;
import com.evshare.ownership.dto.MembershipWithdrawalResponse;
import com.evshare.ownership.dto.ReviewWithdrawalRequest;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MembershipWithdrawalService {

    private final MembershipWithdrawalRequestRepository withdrawalRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final OwnershipTransferRequestRepository transferRepository;
    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final ExpenseShareRepository expenseShareRepository;

    public MembershipWithdrawalService(
            MembershipWithdrawalRequestRepository withdrawalRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            OwnershipTransferRequestRepository transferRepository,
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            ExpenseShareRepository expenseShareRepository
    ) {
        this.withdrawalRepository = withdrawalRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.transferRepository = transferRepository;
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.expenseShareRepository = expenseShareRepository;
    }

    /**
     * Submit a member withdrawal request
     */
    @Transactional
    public MembershipWithdrawalResponse createWithdrawalRequest(UUID groupId, CreateWithdrawalRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        User caller = principal.getUser();

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, caller.getId())
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên trong nhóm đồng sở hữu này."));

        if (member.getStatus() == MemberStatus.INACTIVE || member.getStatus() == MemberStatus.REMOVED) {
            throw new IllegalStateException("Tài khoản của bạn đã không còn hoạt động trong nhóm.");
        }

        if (withdrawalRepository.existsByUserIdAndStatus(caller.getId(), WithdrawalStatus.PENDING)) {
            throw new IllegalStateException("Bạn đã có yêu cầu rút khỏi nhóm đang chờ duyệt.");
        }

        // Section VIII: Validate remaining ownership
        List<OwnershipShare> shares = shareRepository.findByMemberId(member.getId());
        BigDecimal totalOwnership = shares.stream()
                .map(OwnershipShare::getPercentage)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalOwnership.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Thành viên vẫn còn tỷ lệ sở hữu (" + totalOwnership + "%). Vui lòng chuyển nhượng toàn bộ cổ phần trước khi yêu cầu rút khỏi nhóm.");
        }

        // Section VIII: Validate pending transfers
        List<OwnershipTransferRequest> activeTransfers = transferRepository.findByFromUserIdAndStatusIn(
                caller.getId(),
                List.of(TransferStatus.PENDING_ACCEPTANCE, TransferStatus.PENDING_APPROVAL, TransferStatus.PENDING_CONTRACT)
        );
        if (!activeTransfers.isEmpty()) {
            throw new IllegalStateException("Bạn đang có " + activeTransfers.size() + " yêu cầu chuyển nhượng chưa hoàn tất.");
        }

        // Section VIII: Validate active trips
        List<Trip> activeTrips = tripRepository.findByUserIdAndStatus(caller.getId(), TripStatus.ACTIVE);
        if (!activeTrips.isEmpty()) {
            throw new IllegalStateException("Bạn đang có chuyến đi đang diễn ra. Vui lòng hoàn tất và trả xe trước khi rút khỏi nhóm.");
        }

        // Section VIII: Validate active bookings
        Instant now = Instant.now();
        List<Booking> activeBookings = bookingRepository.findByUserIdOrderByStartTimeDesc(caller.getId()).stream()
                .filter(b -> b.getEndTime().isAfter(now) && (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING))
                .toList();
        if (!activeBookings.isEmpty()) {
            throw new IllegalStateException("Bạn đang có lịch đặt xe sắp tới chưa hoàn thành. Vui lòng hủy hoặc hoàn tất lịch đặt trước khi rút khỏi nhóm.");
        }

        // Section IX: Validate unsettled financial obligations
        boolean hasUnsettled = hasUnsettledExpenses(caller.getId());
        if (hasUnsettled) {
            throw new IllegalStateException("NGHĨA VỤ TÀI CHÍNH CHƯA HOÀN TẤT: Bạn còn các khoản chi phí hoặc nghĩa vụ tài chính chưa thanh toán. Vui lòng thanh toán trước khi rút khỏi nhóm.");
        }

        MembershipWithdrawalRequest withdrawal = new MembershipWithdrawalRequest(
                UUID.randomUUID(),
                group,
                member,
                caller,
                request != null && request.reason() != null ? request.reason().trim() : "Thành viên xin rút khỏi nhóm đồng sở hữu"
        );
        withdrawal.setStatus(WithdrawalStatus.PENDING);
        MembershipWithdrawalRequest saved = withdrawalRepository.save(withdrawal);

        member.setStatus(MemberStatus.WITHDRAWAL_PENDING);
        memberRepository.save(member);

        MembershipWithdrawalResponse resp = MembershipWithdrawalResponse.fromEntity(saved);
        resp.setCurrentOwnershipPercentage(totalOwnership);
        resp.setHasOutstandingObligations(false);
        return resp;
    }

    /**
     * List withdrawal requests for a group
     */
    @Transactional(readOnly = true)
    public List<MembershipWithdrawalResponse> getWithdrawalRequestsByGroup(UUID groupId) {
        return withdrawalRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(r -> {
                    MembershipWithdrawalResponse resp = MembershipWithdrawalResponse.fromEntity(r);
                    List<OwnershipShare> s = shareRepository.findByMemberId(r.getMember().getId());
                    BigDecimal share = s.stream().map(OwnershipShare::getPercentage).filter(p -> p != null).reduce(BigDecimal.ZERO, BigDecimal::add);
                    resp.setCurrentOwnershipPercentage(share);
                    resp.setHasOutstandingObligations(hasUnsettledExpenses(r.getUser().getId()));
                    return resp;
                })
                .collect(Collectors.toList());
    }

    /**
     * Representative or Admin reviews a withdrawal request
     */
    @Transactional
    public MembershipWithdrawalResponse reviewWithdrawalRequest(UUID requestId, ReviewWithdrawalRequest review, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        User reviewer = principal.getUser();

        MembershipWithdrawalRequest request = withdrawalRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút nhóm không tồn tại: " + requestId));

        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu này đã được xử lý trước đó (Trạng thái: " + request.getStatus() + ")");
        }

        // Validate reviewer is representative or admin
        boolean isRep = false;
        Optional<GroupMember> reviewerMember = memberRepository.findByGroupIdAndUserId(request.getGroup().getId(), reviewer.getId());
        if (reviewerMember.isPresent() && reviewerMember.get().getMemberRole() == GroupMemberRole.REPRESENTATIVE && reviewerMember.get().getStatus() == MemberStatus.ACTIVE) {
            isRep = true;
        }
        if (!isRep && reviewer.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhóm trưởng (REPRESENTATIVE) hoặc Quản trị viên mới có quyền duyệt yêu cầu rút nhóm.");
        }

        Instant now = Instant.now();
        request.setReviewedAt(now);
        request.setReviewedByUser(reviewer);

        if (review != null && review.approve()) {
            // Re-verify 0% ownership
            List<OwnershipShare> shares = shareRepository.findByMemberId(request.getMember().getId());
            BigDecimal totalOwnership = shares.stream().map(OwnershipShare::getPercentage).filter(p -> p != null).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalOwnership.compareTo(BigDecimal.ZERO) > 0) {
                throw new IllegalStateException("Không thể duyệt rút nhóm vì thành viên vẫn đang nắm giữ " + totalOwnership + "% cổ phần.");
            }

            request.setStatus(WithdrawalStatus.APPROVED);
            GroupMember member = request.getMember();
            member.setStatus(MemberStatus.INACTIVE);
            member.setRemovedAt(now);
            memberRepository.save(member);
        } else {
            request.setStatus(WithdrawalStatus.REJECTED);
            request.setRejectionReason(review != null && review.rejectionReason() != null ? review.rejectionReason().trim() : "Yêu cầu bị từ chối bởi người quản lý nhóm.");
            GroupMember member = request.getMember();
            if (member.getStatus() == MemberStatus.WITHDRAWAL_PENDING) {
                member.setStatus(MemberStatus.ACTIVE);
                memberRepository.save(member);
            }
        }

        MembershipWithdrawalRequest saved = withdrawalRepository.save(request);
        return MembershipWithdrawalResponse.fromEntity(saved);
    }

    private boolean hasUnsettledExpenses(UUID userId) {
        if (userId == null) return false;
        try {
            List<ExpenseShare> userShares = expenseShareRepository.findByUserId(userId);
            return userShares.stream().anyMatch(s -> s.getStatus() != ExpenseShareStatus.SETTLED);
        } catch (Exception e) {
            return false;
        }
    }
}
