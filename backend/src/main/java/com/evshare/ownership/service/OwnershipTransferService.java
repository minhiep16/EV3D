package com.evshare.ownership.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.contract.dto.CreateContractVersionRequest;
import com.evshare.contract.entity.CoOwnershipContract;
import com.evshare.contract.entity.CoOwnershipContractVersion;
import com.evshare.contract.entity.ContractAcceptance;
import com.evshare.contract.entity.ContractVersionStatus;
import com.evshare.contract.entity.ConsentPolicy;
import com.evshare.contract.repository.CoOwnershipContractRepository;
import com.evshare.contract.repository.CoOwnershipContractVersionRepository;
import com.evshare.contract.repository.ContractAcceptanceRepository;
import com.evshare.contract.service.CoOwnershipContractService;
import com.evshare.expense.entity.ExpenseShareStatus;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.ownership.dto.*;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OwnershipTransferService {

    public static final BigDecimal TOTAL_OWNERSHIP = new BigDecimal("100.00");

    private final OwnershipTransferRequestRepository transferRepository;
    private final OwnershipChangeHistoryRepository historyRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final CoOwnershipContractRepository contractRepository;
    private final CoOwnershipContractVersionRepository versionRepository;
    private final ContractAcceptanceRepository acceptanceRepository;
    private final CoOwnershipContractService contractService;
    private final ExpenseShareRepository expenseShareRepository;
    private final ObjectMapper objectMapper;

    public OwnershipTransferService(
            OwnershipTransferRequestRepository transferRepository,
            OwnershipChangeHistoryRepository historyRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            CoOwnershipContractRepository contractRepository,
            CoOwnershipContractVersionRepository versionRepository,
            ContractAcceptanceRepository acceptanceRepository,
            CoOwnershipContractService contractService,
            ExpenseShareRepository expenseShareRepository,
            ObjectMapper objectMapper
    ) {
        this.transferRepository = transferRepository;
        this.historyRepository = historyRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.contractRepository = contractRepository;
        this.versionRepository = versionRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.contractService = contractService;
        this.expenseShareRepository = expenseShareRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Preview proposed ownership distribution before submitting transfer
     */
    @Transactional(readOnly = true)
    public OwnershipDistributionPreviewResponse previewTransferDistribution(
            UUID groupId,
            UUID vehicleId,
            UUID fromUserId,
            UUID toUserId,
            BigDecimal transferPercentage
    ) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Người chuyển nhượng không tồn tại: " + fromUserId));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Người nhận chuyển nhượng không tồn tại: " + toUserId));

        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        GroupMember fromMember = memberRepository.findByGroupIdAndUserId(groupId, fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người chuyển nhượng không phải là thành viên trong nhóm"));

        OwnershipShare fromShare = shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, fromUserId)
                .orElse(null);

        BigDecimal fromCurrent = fromShare != null && fromShare.getPercentage() != null
                ? fromShare.getPercentage()
                : BigDecimal.ZERO;

        BigDecimal pendingTransfers = transferRepository.sumPendingTransferPercentageByFromUserAndGroup(fromUserId, groupId);
        BigDecimal availableStake = fromCurrent.subtract(pendingTransfers != null ? pendingTransfers : BigDecimal.ZERO);

        boolean valid = true;
        String validationMsg = "Tỷ lệ dự kiến hợp lệ và tuân thủ quy tắc bảo toàn 100%.";

        if (transferPercentage == null || transferPercentage.compareTo(BigDecimal.ZERO) <= 0) {
            valid = false;
            validationMsg = "Tỷ lệ chuyển nhượng phải lớn hơn 0%.";
        } else if (transferPercentage.compareTo(availableStake) > 0) {
            valid = false;
            validationMsg = "Tỷ lệ chuyển nhượng (" + transferPercentage + "%) vượt quá cổ phần khả dụng của bạn (" + availableStake + "%).";
        }

        // Financial obligations check
        boolean hasUnsettled = hasOutstandingObligations(fromUserId);
        String finMsg = hasUnsettled
                ? "Lưu ý: Bạn còn một số nghĩa vụ tài chính chưa quyết toán hoàn tất. Nghĩa vụ tài chính lịch sử vẫn thuộc trách nhiệm cá nhân của bạn sau khi chuyển nhượng."
                : "Không có nghĩa vụ tài chính tồn đọng.";

        List<OwnershipDistributionPreviewResponse.MemberSharePreview> memberPreviews = new ArrayList<>();
        boolean recipientIsExistingMember = false;

        for (GroupMember m : activeMembers) {
            OwnershipShare s = shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, m.getUser().getId()).orElse(null);
            BigDecimal cur = s != null && s.getPercentage() != null ? s.getPercentage() : BigDecimal.ZERO;
            BigDecimal proposed = cur;
            BigDecimal delta = BigDecimal.ZERO;

            if (m.getUser().getId().equals(fromUserId)) {
                proposed = cur.subtract(transferPercentage != null ? transferPercentage : BigDecimal.ZERO);
                delta = (transferPercentage != null ? transferPercentage : BigDecimal.ZERO).negate();
            } else if (m.getUser().getId().equals(toUserId)) {
                proposed = cur.add(transferPercentage != null ? transferPercentage : BigDecimal.ZERO);
                delta = transferPercentage != null ? transferPercentage : BigDecimal.ZERO;
                recipientIsExistingMember = true;
            }

            memberPreviews.add(new OwnershipDistributionPreviewResponse.MemberSharePreview(
                    m.getUser().getId(),
                    m.getUser().getFullName(),
                    m.getUser().getEmail(),
                    m.getMemberRole() != null ? m.getMemberRole().name() : "MEMBER",
                    cur.setScale(2, RoundingMode.HALF_UP),
                    proposed.setScale(2, RoundingMode.HALF_UP),
                    delta.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        if (!recipientIsExistingMember) {
            BigDecimal cur = BigDecimal.ZERO;
            BigDecimal proposed = transferPercentage != null ? transferPercentage : BigDecimal.ZERO;
            memberPreviews.add(new OwnershipDistributionPreviewResponse.MemberSharePreview(
                    toUser.getId(),
                    toUser.getFullName(),
                    toUser.getEmail(),
                    "MEMBER",
                    cur.setScale(2, RoundingMode.HALF_UP),
                    proposed.setScale(2, RoundingMode.HALF_UP),
                    proposed.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        String contractVersionFormatted = null;
        String contentSnapshot = null;
        String contentHash = null;

        CoOwnershipContract contract = contractRepository.findByGroupId(groupId).orElse(null);
        if (contract != null) {
            Integer maxVersion = versionRepository.findMaxVersionNumberByContractId(contract.getId());
            int nextVersionNumber = (maxVersion != null ? maxVersion : 0) + 1;
            contractVersionFormatted = "V" + nextVersionNumber + ".0";
            BigDecimal fromCur = resolveUserShare(groupId, vehicleId, fromUserId);
            BigDecimal toCur = resolveUserShare(groupId, vehicleId, toUserId);
            BigDecimal fromNext = fromCur.subtract(transferPercentage != null ? transferPercentage : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal toNext = toCur.add(transferPercentage != null ? transferPercentage : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            Vehicle v = contract.getVehicle();
            String vName = v != null && v.getName() != null ? v.getName() : "VinFast VF8";
            String vPlate = v != null && v.getLicensePlate() != null ? v.getLicensePlate() : "30K-123.45";
            String vVin = v != null && v.getVin() != null ? v.getVin() : "VF8VN2026EV010001";
            contentSnapshot = buildComprehensiveAmendmentText(
                    contract.getContractCode(),
                    nextVersionNumber,
                    null,
                    null,
                    vName,
                    vPlate,
                    vVin,
                    fromUser.getFullName(),
                    fromUser.getEmail(),
                    fromCur,
                    fromNext,
                    toUser.getFullName(),
                    toUser.getEmail(),
                    toCur,
                    toNext,
                    transferPercentage,
                    "Thỏa thuận tự nguyện giữa các thành viên đồng sở hữu"
            );
            contentHash = calculateSha256(contentSnapshot);
        }

        return new OwnershipDistributionPreviewResponse(
                memberPreviews,
                transferPercentage != null ? transferPercentage.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO,
                fromUserId,
                fromUser.getFullName(),
                toUserId,
                toUser.getFullName(),
                valid,
                validationMsg,
                hasUnsettled,
                finMsg,
                contractVersionFormatted,
                contentSnapshot,
                contentHash
        );
    }

    /**
     * Create an ownership transfer request (Step 1)
     */
    @Transactional
    public OwnershipTransferResponse createTransferRequest(UUID groupId, CreateTransferRequest request, HttpServletRequest servletRequest, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện.");
        }
        User caller = principal.getUser();

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        Vehicle vehicle = resolveVehicleForGroup(group);

        // 1. Verify caller is active group member with ownership
        GroupMember fromMember = memberRepository.findByGroupIdAndUserId(groupId, caller.getId())
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên trong nhóm đồng sở hữu này."));

        if (fromMember.getStatus() != MemberStatus.ACTIVE || fromMember.getRemovedAt() != null) {
            throw new AccessDeniedException("Tài khoản thành viên của bạn không ở trạng thái hoạt động.");
        }

        OwnershipShare fromShare = shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicle.getId(), caller.getId())
                .orElseThrow(() -> new IllegalStateException("Bạn không sở hữu cổ phần nào đối với phương tiện này."));

        BigDecimal currentPercentage = fromShare.getPercentage() != null ? fromShare.getPercentage() : BigDecimal.ZERO;
        if (currentPercentage.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Bạn không sở hữu cổ phần nào đối với phương tiện này.");
        }

        // 2. Validate transfer percentage
        BigDecimal reqPercentage = request.transferPercentage();
        if (reqPercentage == null || reqPercentage.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tỷ lệ chuyển nhượng phải lớn hơn 0%.");
        }

        BigDecimal pendingTransfers = transferRepository.sumPendingTransferPercentageByFromUserAndGroup(caller.getId(), groupId);
        BigDecimal availableStake = currentPercentage.subtract(pendingTransfers != null ? pendingTransfers : BigDecimal.ZERO);

        if (reqPercentage.compareTo(availableStake) > 0) {
            throw new IllegalStateException("Tỷ lệ chuyển nhượng (" + reqPercentage + "%) vượt quá cổ phần khả dụng của bạn (" + availableStake + "%).");
        }

        // Idempotency protection: Prevent duplicate active transfer requests between the same co-owners
        List<OwnershipTransferRequest> activeExisting = transferRepository.findByFromUserIdAndStatusIn(
                caller.getId(),
                List.of(TransferStatus.PENDING_ACCEPTANCE, TransferStatus.PENDING_CONTRACT, TransferStatus.APPROVED)
        ).stream().filter(r -> r.getToUser().getId().equals(request.toUserId()) && r.getGroup().getId().equals(groupId)).toList();

        if (!activeExisting.isEmpty()) {
            throw new DuplicateResourceException("Đã có một yêu cầu chuyển nhượng đang chờ xử lý giữa bạn và thành viên này. Vui lòng hoàn tất hoặc hủy yêu cầu trước đó.");
        }

        // 3. Validate recipient
        if (request.toUserId().equals(caller.getId())) {
            throw new IllegalArgumentException("Không thể tự chuyển nhượng cổ phần cho chính mình.");
        }

        User toUser = userRepository.findById(request.toUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Người nhận chuyển nhượng không tồn tại: " + request.toUserId()));

        if (toUser.getStatus() != UserStatus.ACTIVE || toUser.getRole() != Role.CO_OWNER) {
            throw new IllegalArgumentException("Người nhận chuyển nhượng phải có tài khoản CO_OWNER đang hoạt động.");
        }

        // If recipient is a new member, check single-contract invariant
        Optional<GroupMember> toMemberOpt = memberRepository.findByGroupIdAndUserId(groupId, toUser.getId());
        if (toMemberOpt.isEmpty()) {
            validateUserHasNoOtherActiveContract(toUser.getId(), groupId);
            // Create pending member record
            GroupMember newMember = new GroupMember(UUID.randomUUID(), group, toUser, GroupMemberRole.MEMBER, MemberStatus.TRANSFER_PENDING);
            memberRepository.save(newMember);
        }

        // Section 5: Require explicit consent from transferor at submission
        if (!Boolean.TRUE.equals(request.acknowledgedTerms())) {
            throw new IllegalArgumentException("Vui lòng đọc, hiểu và đồng ý chuyển nhượng theo đúng nội dung phụ lục trước khi gửi yêu cầu.");
        }

        // 4. Create and persist OwnershipTransferRequest
        UUID transferId = UUID.randomUUID();
        OwnershipTransferRequest transfer = new OwnershipTransferRequest(
                transferId,
                group,
                vehicle,
                caller,
                toUser,
                reqPercentage.setScale(2, RoundingMode.HALF_UP),
                request.reason() != null ? request.reason().trim() : null
        );
        transfer.setStatus(TransferStatus.PENDING_ACCEPTANCE);

        // Section 3: Prepare the exact proposed amendment FIRST and atomically record transferor consent
        CoOwnershipContract contract = contractRepository.findByGroupId(groupId)
                .orElseThrow(() -> new IllegalStateException("Hợp đồng đồng sở hữu của nhóm không tồn tại để khởi tạo phụ lục chuyển nhượng."));

        CoOwnershipContractVersion amendmentVersion = createContractAmendmentVersion(transfer, contract, principal);
        transfer.setContractVersion(amendmentVersion);

        if (request.contentHash() != null && !request.contentHash().isBlank() && !request.contentHash().equalsIgnoreCase(amendmentVersion.getContentHash())) {
            throw new IllegalStateException("Mã băm nội dung phụ lục không khớp với bản xem trước. Vui lòng tải lại và đồng ý nội dung mới nhất.");
        }

        ContractAcceptance transferorAcceptance = new ContractAcceptance(
                UUID.randomUUID(),
                amendmentVersion,
                caller,
                amendmentVersion.getContentHash(),
                "TRANSFER_TRANSFEROR_COMBINED_ACCEPTANCE",
                extractClientIp(servletRequest),
                extractUserAgent(servletRequest)
        );
        acceptanceRepository.save(transferorAcceptance);

        OwnershipTransferRequest saved = transferRepository.save(transfer);

        OwnershipTransferResponse resp = buildEnrichedTransferResponse(saved, caller.getId());
        resp.setFromUserCurrentPercentage(currentPercentage);
        resp.setToUserCurrentPercentage(resolveUserShare(groupId, vehicle.getId(), toUser.getId()));
        return resp;
    }

    /**
     * Recipient reviews and explicitly accepts the transfer request (Step 2)
     */
    @Transactional
    public OwnershipTransferResponse acceptTransferRequest(
            UUID transferId,
            AcceptTransferConsentRequest request,
            HttpServletRequest servletRequest,
            UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        OwnershipTransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuyển nhượng không tồn tại: " + transferId));

        User caller = principal.getUser();
        boolean isRecipient = transfer.getToUser().getId().equals(caller.getId());
        boolean isTransferor = transfer.getFromUser().getId().equals(caller.getId());
        if (!isRecipient && !isTransferor) {
            throw new AccessDeniedException("Bạn không phải là bên tham gia trong yêu cầu chuyển nhượng này.");
        }

        if (transfer.getStatus() == TransferStatus.COMPLETED) {
            return buildEnrichedTransferResponse(transfer, caller.getId());
        }

        if (transfer.getStatus() != TransferStatus.PENDING_ACCEPTANCE &&
            transfer.getStatus() != TransferStatus.PENDING_CONTRACT &&
            transfer.getStatus() != TransferStatus.APPROVED) {
            throw new IllegalStateException("Yêu cầu chuyển nhượng không ở trạng thái chờ xác nhận tiếp nhận.");
        }

        // Revalidate transferable percentage is still available
        OwnershipShare fromShare = shareRepository.findByGroupIdAndVehicleIdAndUserId(
                transfer.getGroup().getId(), transfer.getVehicle().getId(), transfer.getFromUser().getId()
        ).orElse(null);

        BigDecimal curPercentage = fromShare != null && fromShare.getPercentage() != null ? fromShare.getPercentage() : BigDecimal.ZERO;
        if (transfer.getTransferPercentage().compareTo(curPercentage) > 0) {
            throw new IllegalStateException("Người chuyển nhượng không còn đủ tỷ lệ sở hữu để hoàn tất giao dịch này.");
        }

        // Section 3 & 4: Ensure amendment version exists and verify recipient/transferor explicit consent
        CoOwnershipContractVersion version = transfer.getContractVersion();
        if (version == null) {
            version = ensureContractAmendmentVersion(transfer, principal);
        }

        if (version == null) {
            throw new IllegalStateException("Không tìm thấy phụ lục hợp đồng liên kết với yêu cầu chuyển nhượng này.");
        }

        if (request == null || !Boolean.TRUE.equals(request.acknowledgedTerms())) {
            throw new IllegalArgumentException("Vui lòng xác nhận đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung Phụ lục hợp đồng trước khi tiếp nhận.");
        }

        if (request.contentHash() == null || !request.contentHash().equalsIgnoreCase(version.getContentHash())) {
            throw new IllegalStateException("Mã băm nội dung phụ lục không khớp với phiên bản máy chủ. Vui lòng tải lại trang để xem trước nội dung mới nhất.");
        }

        // Atomically record acceptance if not already recorded (no duplicates)
        if (!acceptanceRepository.existsByContractVersionIdAndUserId(version.getId(), caller.getId())) {
            String method = isRecipient ? "TRANSFER_RECIPIENT_COMBINED_ACCEPTANCE" : "TRANSFER_TRANSFEROR_COMBINED_ACCEPTANCE";
            ContractAcceptance acceptance = new ContractAcceptance(
                    UUID.randomUUID(),
                    version,
                    caller,
                    version.getContentHash(),
                    method,
                    extractClientIp(servletRequest),
                    extractUserAgent(servletRequest)
            );
            acceptanceRepository.save(acceptance);
        }

        Instant now = Instant.now();
        if (isRecipient && transfer.getAcceptedAt() == null) {
            transfer.setAcceptedAt(now);
        }

        // Check if required consents are complete for this policy
        boolean consentComplete = checkTransferConsentComplete(transfer, version);
        if (consentComplete) {
            boolean finOk = !hasOutstandingObligations(transfer.getFromUser().getId());
            if (finOk) {
                // Auto-finalize atomically!
                return executeTransferActivationInternal(transfer, caller);
            } else {
                transfer.setStatus(TransferStatus.APPROVED);
            }
        } else {
            transfer.setStatus(TransferStatus.PENDING_CONTRACT);
        }

        OwnershipTransferRequest saved = transferRepository.save(transfer);
        OwnershipTransferResponse resp = buildEnrichedTransferResponse(saved, caller.getId());
        resp.setFromUserCurrentPercentage(curPercentage);
        resp.setToUserCurrentPercentage(resolveUserShare(transfer.getGroup().getId(), transfer.getVehicle().getId(), transfer.getToUser().getId()));
        return resp;
    }

    /**
     * Recipient rejects the transfer request
     */
    @Transactional
    public OwnershipTransferResponse rejectTransferRequest(UUID transferId, RejectTransferRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        OwnershipTransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuyển nhượng không tồn tại: " + transferId));

        if (!transfer.getToUser().getId().equals(principal.getUser().getId())) {
            throw new AccessDeniedException("Bạn không phải là người nhận trong yêu cầu chuyển nhượng này.");
        }

        if (transfer.getStatus() != TransferStatus.PENDING_ACCEPTANCE) {
            throw new IllegalStateException("Yêu cầu chuyển nhượng không ở trạng thái chờ xác nhận.");
        }

        transfer.setStatus(TransferStatus.REJECTED);
        transfer.setRejectedAt(Instant.now());
        transfer.setRejectionReason(request != null && request.rejectionReason() != null ? request.rejectionReason().trim() : "Bên nhận từ chối tiếp nhận.");
        OwnershipTransferRequest saved = transferRepository.save(transfer);

        return OwnershipTransferResponse.fromEntity(saved, principal.getUser().getId());
    }

    /**
     * Transferor cancels the transfer request
     */
    @Transactional
    public OwnershipTransferResponse cancelTransferRequest(UUID transferId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        OwnershipTransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuyển nhượng không tồn tại: " + transferId));

        if (!transfer.getFromUser().getId().equals(principal.getUser().getId())) {
            throw new AccessDeniedException("Chỉ người tạo yêu cầu chuyển nhượng mới có quyền hủy.");
        }

        if (transfer.getStatus() == TransferStatus.COMPLETED) {
            throw new IllegalStateException("Giao dịch chuyển nhượng đã hoàn tất thành công, không thể hủy.");
        }

        transfer.setStatus(TransferStatus.CANCELLED);
        transfer.setCancelledAt(Instant.now());
        OwnershipTransferRequest saved = transferRepository.save(transfer);

        return OwnershipTransferResponse.fromEntity(saved, principal.getUser().getId());
    }

    /**
     * Complete and atomically activate ownership transfer (Step 3 & 4)
     * Executes atomic database transaction:
     * 1. Revalidates available transferable stake
     * 2. Deducts transferor ownership
     * 3. Increases recipient ownership
     * 4. Enforces SUM = 100.00%
     * 5. Records immutable OwnershipChangeHistory
     * 6. Marks request as COMPLETED with authoritative effectiveAt timestamp
     */
    @Transactional
    public OwnershipTransferResponse completeTransfer(UUID transferId, UserPrincipal principal) {
        OwnershipTransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuyển nhượng không tồn tại: " + transferId));
        return executeTransferActivationInternal(transfer, principal != null ? principal.getUser() : null);
    }

    @Transactional
    public OwnershipTransferResponse confirmTransferorConsent(
            UUID transferId,
            AcceptTransferConsentRequest request,
            HttpServletRequest servletRequest,
            UserPrincipal principal
    ) {
        return acceptTransferRequest(transferId, request, servletRequest, principal);
    }

    @Transactional
    public OwnershipTransferResponse executeTransferActivationInternal(OwnershipTransferRequest transfer, User principalUser) {
        CoOwnershipGroup group = transfer.getGroup();
        Vehicle vehicle = transfer.getVehicle();
        UUID groupId = group.getId();
        UUID vehicleId = vehicle.getId();
        UUID fromUserId = transfer.getFromUser().getId();
        UUID toUserId = transfer.getToUser().getId();
        BigDecimal transferAmount = transfer.getTransferPercentage();

        if (transfer.getStatus() == TransferStatus.COMPLETED) {
            return buildEnrichedTransferResponse(transfer, principalUser != null ? principalUser.getId() : null);
        }

        if (transfer.getStatus() != TransferStatus.PENDING_CONTRACT &&
            transfer.getStatus() != TransferStatus.APPROVED &&
            transfer.getStatus() != TransferStatus.PENDING_ACCEPTANCE) {
            throw new IllegalStateException("Yêu cầu chuyển nhượng không ở trạng thái hợp lệ để kích hoạt (Hiện tại: " + transfer.getStatus() + ")");
        }

        // Section 8 & Section 6: Contract and co-owner acceptance validation before activation
        if (transfer.getContractVersion() != null) {
            CoOwnershipContractVersion version = transfer.getContractVersion();
            List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(version.getId());
            Set<UUID> validAcceptedUserIds = acceptances.stream()
                    .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                    .map(a -> a.getUser().getId())
                    .collect(Collectors.toSet());

            if (!validAcceptedUserIds.contains(toUserId)) {
                throw new IllegalStateException("Không thể hoàn tất chuyển nhượng: Người nhận chưa ký xác nhận phụ lục hợp đồng hoặc mã băm không khớp.");
            }

            if (!validAcceptedUserIds.contains(fromUserId)) {
                throw new IllegalStateException("Không thể hoàn tất chuyển nhượng: Người chuyển nhượng chưa ký xác nhận phụ lục hợp đồng hoặc mã băm không khớp.");
            }

            ConsentPolicy consentPolicy = resolveTransferConsentPolicy(group, transfer.getFromUser(), transfer.getToUser());
            if (consentPolicy != ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER) {
                List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                        .stream().filter(m -> m.getRemovedAt() == null).toList();
                for (GroupMember m : activeMembers) {
                    if (!validAcceptedUserIds.contains(m.getUser().getId())) {
                        throw new IllegalStateException("Không thể hoàn tất chuyển nhượng: Thành viên đồng sở hữu " + m.getUser().getFullName() + " chưa ký xác nhận phụ lục hợp đồng.");
                    }
                }
            }
        }

        // Section 10: Financial obligations recheck before activation
        if (hasOutstandingObligations(fromUserId)) {
            throw new IllegalStateException("Không thể hoàn tất chuyển nhượng: Người chuyển nhượng còn nghĩa vụ tài chính chưa thanh toán.");
        }

        // Snapshot PREVIOUS ownership state
        String previousSnapshotJson = buildOwnershipSnapshotJson(groupId, vehicleId);

        // 1. Revalidate transferor available stake under lock/isolation
        OwnershipShare fromShare = shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, fromUserId)
                .orElseThrow(() -> new IllegalStateException("Người chuyển nhượng không còn hồ sơ sở hữu cổ phần hợp lệ."));

        BigDecimal fromCurrent = fromShare.getPercentage() != null ? fromShare.getPercentage() : BigDecimal.ZERO;
        if (fromCurrent.compareTo(transferAmount) < 0) {
            throw new IllegalStateException("Cổ phần hiện tại của người chuyển nhượng (" + fromCurrent + "%) không đủ để thực hiện chuyển nhượng " + transferAmount + "%.");
        }

        // 2. Adjust transferor share
        BigDecimal newFromPercentage = fromCurrent.subtract(transferAmount).setScale(2, RoundingMode.HALF_UP);
        fromShare.setPercentage(newFromPercentage);
        shareRepository.save(fromShare);

        // 3. Adjust or create recipient share
        GroupMember toMember = memberRepository.findByGroupIdAndUserId(groupId, toUserId)
                .orElseGet(() -> {
                    GroupMember nm = new GroupMember(UUID.randomUUID(), group, transfer.getToUser(), GroupMemberRole.MEMBER, MemberStatus.ACTIVE);
                    return memberRepository.save(nm);
                });

        if (toMember.getStatus() != MemberStatus.ACTIVE) {
            toMember.setStatus(MemberStatus.ACTIVE);
            toMember.setRemovedAt(null);
            memberRepository.save(toMember);
        }

        OwnershipShare toShare = shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, toUserId)
                .orElseGet(() -> {
                    OwnershipShare ns = new OwnershipShare(UUID.randomUUID(), group, vehicle, toMember, BigDecimal.ZERO);
                    return ns;
                });

        BigDecimal toCurrent = toShare.getPercentage() != null ? toShare.getPercentage() : BigDecimal.ZERO;
        BigDecimal newToPercentage = toCurrent.add(transferAmount).setScale(2, RoundingMode.HALF_UP);
        toShare.setPercentage(newToPercentage);
        shareRepository.save(toShare);

        // 4. Strict Ownership Conservation Check (SUM == 100.00%)
        BigDecimal sumAll = shareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (sumAll.compareTo(TOTAL_OWNERSHIP) != 0) {
            throw new IllegalStateException("Lỗi bảo toàn tỷ lệ sở hữu: Tổng tỷ lệ sau chuyển nhượng (" + sumAll + "%) không bằng chính xác 100.00%.");
        }

        // Snapshot NEW ownership state
        String newSnapshotJson = buildOwnershipSnapshotJson(groupId, vehicleId);

        Instant now = Instant.now();

        // 5. Record immutable OwnershipChangeHistory audit trail
        OwnershipChangeHistory history = new OwnershipChangeHistory(
                UUID.randomUUID(),
                group,
                vehicle,
                transfer,
                transfer.getFromUser(),
                transfer.getToUser(),
                transferAmount,
                previousSnapshotJson,
                newSnapshotJson,
                transfer.getReason() != null ? transfer.getReason() : "Chuyển nhượng quyền sở hữu đồng sở hữu",
                now,
                principalUser != null ? principalUser : transfer.getFromUser()
        );
        historyRepository.save(history);

        // 6. Update transfer request record
        transfer.setStatus(TransferStatus.COMPLETED);
        transfer.setCompletedAt(now);
        transfer.setEffectiveAt(now);
        OwnershipTransferRequest completedTransfer = transferRepository.save(transfer);

        // 7. Update contract version if associated
        if (transfer.getContractVersion() != null) {
            CoOwnershipContractVersion version = transfer.getContractVersion();
            CoOwnershipContract contract = version.getContract();

            if (contract.getCurrentVersion() != null && !contract.getCurrentVersion().getId().equals(version.getId())) {
                CoOwnershipContractVersion prevVersion = contract.getCurrentVersion();
                prevVersion.setStatus(ContractVersionStatus.SUPERSEDED);
                prevVersion.setEffectiveUntil(now);
                versionRepository.save(prevVersion);
            }

            version.setStatus(ContractVersionStatus.ACTIVE);
            version.setEffectiveFrom(now);
            version.setActivatedAt(now);
            versionRepository.save(version);

            contract.setCurrentVersion(version);
            contract.setStatus(com.evshare.contract.entity.ContractStatus.ACTIVE);
            contractRepository.save(contract);
        }

        OwnershipTransferResponse resp = buildEnrichedTransferResponse(completedTransfer, principalUser != null ? principalUser.getId() : null);
        resp.setFromUserCurrentPercentage(newFromPercentage);
        resp.setToUserCurrentPercentage(newToPercentage);
        return resp;
    }

    /**
     * List all transfer requests for a group
     */
    @Transactional
    public List<OwnershipTransferResponse> getTransferRequestsByGroup(UUID groupId, UserPrincipal principal) {
        UUID currentUserId = principal != null && principal.getUser() != null ? principal.getUser().getId() : null;
        return transferRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(r -> {
                    if (r.getContractVersion() == null && (r.getStatus() == TransferStatus.PENDING_ACCEPTANCE || r.getStatus() == TransferStatus.PENDING_CONTRACT)) {
                        try {
                            ensureContractAmendmentVersion(r, principal);
                        } catch (Exception ignored) {}
                    }
                    OwnershipTransferResponse resp = buildEnrichedTransferResponse(r, currentUserId);
                    resp.setFromUserCurrentPercentage(resolveUserShare(r.getGroup().getId(), r.getVehicle().getId(), r.getFromUser().getId()));
                    resp.setToUserCurrentPercentage(resolveUserShare(r.getGroup().getId(), r.getVehicle().getId(), r.getToUser().getId()));
                    return resp;
                })
                .collect(Collectors.toList());
    }

    /**
     * List incoming transfer requests for authenticated user
     */
    @Transactional
    public List<OwnershipTransferResponse> getIncomingTransferRequests(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        UUID userId = principal.getUser().getId();
        return transferRepository.findByToUserIdAndStatusInOrderByCreatedAtDesc(
                userId,
                List.of(TransferStatus.PENDING_ACCEPTANCE, TransferStatus.PENDING_CONTRACT, TransferStatus.APPROVED)
        ).stream().map(r -> {
            if (r.getContractVersion() == null && (r.getStatus() == TransferStatus.PENDING_ACCEPTANCE || r.getStatus() == TransferStatus.PENDING_CONTRACT)) {
                try {
                    ensureContractAmendmentVersion(r, principal);
                } catch (Exception ignored) {}
            }
            OwnershipTransferResponse resp = buildEnrichedTransferResponse(r, userId);
            resp.setFromUserCurrentPercentage(resolveUserShare(r.getGroup().getId(), r.getVehicle().getId(), r.getFromUser().getId()));
            resp.setToUserCurrentPercentage(resolveUserShare(r.getGroup().getId(), r.getVehicle().getId(), r.getToUser().getId()));
            return resp;
        }).collect(Collectors.toList());
    }

    /**
     * Get specific transfer request details
     */
    @Transactional
    public OwnershipTransferResponse getTransferRequestById(UUID transferId, UserPrincipal principal) {
        OwnershipTransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu chuyển nhượng không tồn tại: " + transferId));
        UUID userId = principal != null && principal.getUser() != null ? principal.getUser().getId() : null;
        if (transfer.getContractVersion() == null && (transfer.getStatus() == TransferStatus.PENDING_ACCEPTANCE || transfer.getStatus() == TransferStatus.PENDING_CONTRACT)) {
            try {
                ensureContractAmendmentVersion(transfer, principal);
            } catch (Exception ignored) {}
        }
        OwnershipTransferResponse resp = buildEnrichedTransferResponse(transfer, userId);
        resp.setFromUserCurrentPercentage(resolveUserShare(transfer.getGroup().getId(), transfer.getVehicle().getId(), transfer.getFromUser().getId()));
        resp.setToUserCurrentPercentage(resolveUserShare(transfer.getGroup().getId(), transfer.getVehicle().getId(), transfer.getToUser().getId()));
        return resp;
    }

    /**
     * Get ownership change history for a group
     */
    @Transactional(readOnly = true)
    public List<OwnershipHistoryResponse> getOwnershipHistory(UUID groupId) {
        return historyRepository.findByGroupIdOrderByEffectiveAtDesc(groupId).stream()
                .map(OwnershipHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // HELPER & SNAPSHOT METHODS
    // =========================================================================

    private Vehicle resolveVehicleForGroup(CoOwnershipGroup group) {
        if (group.getVehicleId() != null) {
            return vehicleRepository.findById(group.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phương tiện không tồn tại: " + group.getVehicleId()));
        }
        if (!group.getGroupVehicles().isEmpty()) {
            return group.getGroupVehicles().get(0).getVehicle();
        }
        return vehicleRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có phương tiện nào trong hệ thống."));
    }

    private BigDecimal resolveUserShare(UUID groupId, UUID vehicleId, UUID userId) {
        return shareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, userId)
                .map(OwnershipShare::getPercentage)
                .orElse(BigDecimal.ZERO);
    }

    public boolean hasOutstandingObligations(UUID userId) {
        if (userId == null) return false;
        try {
            return expenseShareRepository.findByUserId(userId).stream()
                    .anyMatch(s -> s.getStatus() != ExpenseShareStatus.SETTLED);
        } catch (Exception e) {
            return false;
        }
    }

    private void validateUserHasNoOtherActiveContract(UUID userId, UUID targetGroupId) {
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        for (GroupMember existing : activeMemberships) {
            if (existing.getRemovedAt() == null && !existing.getGroup().getId().equals(targetGroupId)) {
                CoOwnershipGroup otherGroup = existing.getGroup();
                if (otherGroup != null && otherGroup.getStatus() == GroupStatus.ACTIVE) {
                    throw new DuplicateResourceException(
                            "Người dùng đã có hợp đồng đồng sở hữu đang hoạt động với một phương tiện khác."
                    );
                }
            }
        }
    }

    private CoOwnershipContractVersion ensureContractAmendmentVersion(OwnershipTransferRequest transfer, UserPrincipal principal) {
        if (transfer.getContractVersion() != null) {
            return transfer.getContractVersion();
        }
        CoOwnershipContract contract = contractRepository.findByGroupId(transfer.getGroup().getId()).orElse(null);
        if (contract != null) {
            CoOwnershipContractVersion version = createContractAmendmentVersion(transfer, contract, principal);
            transfer.setContractVersion(version);
            transferRepository.save(transfer);
            return version;
        }
        return null;
    }

    private CoOwnershipContractVersion createContractAmendmentVersion(
            OwnershipTransferRequest transfer,
            CoOwnershipContract contract,
            UserPrincipal principal
    ) {
        UUID groupId = transfer.getGroup().getId();
        UUID vehicleId = transfer.getVehicle().getId();

        Integer maxVersion = versionRepository.findMaxVersionNumberByContractId(contract.getId());
        int nextVersionNumber = (maxVersion != null ? maxVersion : 0) + 1;

        // Build proposed ownership snapshot JSON
        List<Map<String, Object>> proposedSnapshot = new ArrayList<>();
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        BigDecimal fromCur = resolveUserShare(groupId, vehicleId, transfer.getFromUser().getId());
        BigDecimal toCur = resolveUserShare(groupId, vehicleId, transfer.getToUser().getId());
        BigDecimal fromNext = fromCur.subtract(transfer.getTransferPercentage()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal toNext = toCur.add(transfer.getTransferPercentage()).setScale(2, RoundingMode.HALF_UP);

        boolean recipientIncluded = false;
        for (GroupMember m : activeMembers) {
            BigDecimal cur = resolveUserShare(groupId, vehicleId, m.getUser().getId());
            BigDecimal next = cur;
            if (m.getUser().getId().equals(transfer.getFromUser().getId())) {
                next = fromNext;
            } else if (m.getUser().getId().equals(transfer.getToUser().getId())) {
                next = toNext;
                recipientIncluded = true;
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", m.getUser().getId().toString());
            map.put("fullName", m.getUser().getFullName());
            map.put("email", m.getUser().getEmail());
            map.put("role", m.getMemberRole() != null ? m.getMemberRole().name() : "MEMBER");
            map.put("percentage", next);
            proposedSnapshot.add(map);
        }

        if (!recipientIncluded) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", transfer.getToUser().getId().toString());
            map.put("fullName", transfer.getToUser().getFullName());
            map.put("email", transfer.getToUser().getEmail());
            map.put("role", "MEMBER");
            map.put("percentage", toNext);
            proposedSnapshot.add(map);
        }

        String proposedOwnershipJson = toJson(proposedSnapshot);

        Map<String, Object> votingMap = new LinkedHashMap<>();
        votingMap.put("decisionRule", contract.getGroup().getVotingRule() != null ? contract.getGroup().getVotingRule() : "OWNERSHIP_WEIGHTED");
        votingMap.put("quorumPercentage", contract.getGroup().getQuorumPercentage() != null ? contract.getGroup().getQuorumPercentage() : new BigDecimal("50.00"));
        votingMap.put("approvalThresholdPercentage", contract.getGroup().getApprovalThresholdPercentage() != null ? contract.getGroup().getApprovalThresholdPercentage() : new BigDecimal("50.00"));

        Map<String, Object> financialMap = new LinkedHashMap<>();
        financialMap.put("chargingPolicy", "USER_RESPONSIBILITY");
        financialMap.put("maintenancePolicy", "USAGE_AND_CAPITAL");
        financialMap.put("insurancePolicy", "OWNERSHIP_RATIO");

        UUID appendixId = UUID.randomUUID();
        Vehicle vehicle = contract.getVehicle();
        String vehicleName = vehicle != null && vehicle.getName() != null ? vehicle.getName() : "VinFast VF8";
        String vehiclePlate = vehicle != null && vehicle.getLicensePlate() != null ? vehicle.getLicensePlate() : "30K-123.45";
        String vehicleVin = vehicle != null && vehicle.getVin() != null ? vehicle.getVin() : "VF8VN2026EV010001";

        String contentSnapshot = buildComprehensiveAmendmentText(
                contract.getContractCode(),
                nextVersionNumber,
                appendixId,
                transfer.getId(),
                vehicleName,
                vehiclePlate,
                vehicleVin,
                transfer.getFromUser().getFullName(),
                transfer.getFromUser().getEmail(),
                fromCur,
                fromNext,
                transfer.getToUser().getFullName(),
                transfer.getToUser().getEmail(),
                toCur,
                toNext,
                transfer.getTransferPercentage(),
                (transfer.getReason() != null && !transfer.getReason().isBlank()) ? transfer.getReason().trim() : "Thỏa thuận tự nguyện giữa các thành viên đồng sở hữu"
        );

        String contentHash = calculateSha256(contentSnapshot);

        User creator = (principal != null && principal.getUser() != null) ? principal.getUser() : transfer.getFromUser();

        CoOwnershipContractVersion amendment = new CoOwnershipContractVersion(
                appendixId,
                contract,
                nextVersionNumber,
                "Phụ lục Chuyển nhượng Sở hữu " + vehicleName + " (V" + nextVersionNumber + ".0)",
                contentSnapshot,
                contentHash,
                proposedOwnershipJson,
                toJson(votingMap),
                toJson(financialMap),
                creator
        );
        amendment.setStatus(ContractVersionStatus.PENDING_ACCEPTANCE);
        return versionRepository.save(amendment);
    }

    public String buildComprehensiveAmendmentText(
            String contractCode,
            int versionNumber,
            UUID appendixId,
            UUID transferId,
            String vehicleName,
            String vehiclePlate,
            String vehicleVin,
            String fromUserName,
            String fromUserEmail,
            BigDecimal fromBefore,
            BigDecimal fromAfter,
            String toUserName,
            String toUserEmail,
            BigDecimal toBefore,
            BigDecimal toAfter,
            BigDecimal transferPercentage,
            String reason
    ) {
        String code = (contractCode != null && !contractCode.isBlank()) ? contractCode : "HĐ-EV01";
        String dateStr = Instant.now().toString().substring(0, 10);
        return "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n"
                + "Độc lập - Tự do - Hạnh phúc\n\n"
                + "PHỤ LỤC HỢP ĐỒNG ĐỒNG SỞ HỮU VÀ ĐIỀU CHỈNH TỶ LỆ CỔ PHẦN\n"
                + "(Phiên bản: V" + versionNumber + ".0 — Thuộc Hợp đồng gốc mã: " + code + ")\n\n"
                + "1. CĂN CỨ VÀ ĐỊNH DANH PHỤ LỤC\n"
                + "- Mã hợp đồng gốc: " + code + "\n"
                + "- Phiên bản hợp đồng sửa đổi: V" + versionNumber + ".0\n"
                + "- Phân loại văn bản: Phụ lục Chuyển nhượng Cổ phần Đồng sở hữu Nội bộ\n"
                + "- Ngày lập văn bản: " + dateStr + "\n"
                + "- Nền tảng điều phối: Hệ thống xe điện chia sẻ EVShare 3D\n\n"
                + "2. THÔNG TIN PHƯƠNG TIỆN ĐỒNG SỞ HỮU\n"
                + "- Tên phương tiện: " + (vehicleName != null ? vehicleName : "VinFast VF8") + "\n"
                + "- Biển số kiểm soát: " + (vehiclePlate != null ? vehiclePlate : "30K-123.45") + "\n"
                + "- Số khung (VIN): " + (vehicleVin != null ? vehicleVin : "VF8VN2026EV010001") + "\n"
                + "- Tình trạng pháp lý: Đang hoạt động theo mô hình nhóm đồng sở hữu EVShare 3D\n\n"
                + "3. CÁC BÊN THAM GIA GIAO DỊCH CHUYỂN NHƯỢNG\n"
                + "- Bên chuyển nhượng: " + fromUserName + " (" + fromUserEmail + ")\n"
                + "  + Tỷ lệ sở hữu trước chuyển nhượng: " + (fromBefore != null ? fromBefore.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%\n"
                + "  + Tỷ lệ sở hữu sau chuyển nhượng: " + (fromAfter != null ? fromAfter.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%\n"
                + "- Bên nhận chuyển nhượng: " + toUserName + " (" + toUserEmail + ")\n"
                + "  + Tỷ lệ sở hữu trước chuyển nhượng: " + (toBefore != null ? toBefore.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%\n"
                + "  + Tỷ lệ sở hữu sau chuyển nhượng: " + (toAfter != null ? toAfter.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%\n"
                + "- Tỷ lệ cổ phần chuyển nhượng: " + (transferPercentage != null ? transferPercentage.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%\n\n"
                + "4. THỎA THUẬN VÀ ĐIỀU KIỆN CHUYỂN NHƯỢNG\n"
                + "- Tự nguyện giao dịch: Bên chuyển nhượng tự nguyện chuyển giao và Bên nhận chuyển nhượng đồng ý tiếp nhận " + (transferPercentage != null ? transferPercentage.setScale(2, RoundingMode.HALF_UP) : "0.00") + "% quyền sở hữu.\n"
                + "- Lý do chuyển nhượng: " + (reason != null && !reason.isBlank() ? reason : "Thỏa thuận tự nguyện giữa các thành viên đồng sở hữu") + "\n"
                + "- Nguyên tắc bảo toàn: Tổng tỷ lệ sở hữu của tất cả thành viên trong nhóm luôn đảm bảo chính xác 100.00%.\n\n"
                + "5. NGHĨA VỤ TÀI CHÍNH VÀ QUY CHẾ VẬN HÀNH\n"
                + "- Phân bổ chi phí chung: Bên nhận chuyển nhượng kế thừa toàn bộ quyền lợi và nghĩa vụ tài chính định kỳ (bảo dưỡng, bảo hiểm, đăng kiểm) tương ứng với tỷ lệ sở hữu mới (" + (toAfter != null ? toAfter.setScale(2, RoundingMode.HALF_UP) : "0.00") + "%).\n"
                + "- Chi phí sạc điện: Phát sinh trong thời gian đặt xe thuộc 100% trách nhiệm của cá nhân người lái xe (USER_RESPONSIBILITY).\n"
                + "- Quỹ chung (Shared Fund): Tiếp tục duy trì và giải ngân đúng quy chế hợp đồng gốc.\n"
                + "- Quy chế biểu quyết và đặt xe: Quyền biểu quyết và hạn mức sử dụng xe được điều chỉnh tỷ lệ thuận theo tỷ lệ sở hữu mới.\n"
                + "- Quy trình giao nhận xe: Bắt buộc thực hiện bàn giao qua nhân viên STAFF tại trạm với xác nhận ngoại quan 3D và tình trạng pin.\n\n"
                + "6. ĐIỀU KIỆN PHÊ DUYỆT VÀ HIỆU LỰC THI HÀNH\n"
                + "- Cơ chế xác nhận giao dịch nội bộ: Áp dụng cơ chế xác nhận hai bên (2/2) giữa Bên chuyển nhượng và Bên nhận chuyển nhượng theo quy định Thỏa thuận đồng sở hữu đối với giao dịch nội bộ. Các đồng sở hữu khác trong nhóm được gửi thông báo chi tiết và bảo lưu đầy đủ quyền ưu tiên mua trước hoặc quyền phản đối theo quy chế.\n"
                + "- Điều kiện kích hoạt: Phụ lục chỉ phát sinh hiệu lực chính thức khi: (1) Cả hai bên tham gia hoàn tất ký xác nhận điện tử với mã băm niêm phong; (2) Không có nghĩa vụ tài chính tồn đọng; (3) Hệ thống EVShare 3D kích hoạt điều chỉnh và ghi sổ cái lịch sử sở hữu.\n"
                + "- Các điều khoản khác: Mọi điều khoản khác của Hợp đồng gốc số " + code + " không bị sửa đổi bởi phụ lục này vẫn giữ nguyên hiệu lực thi hành.\n"
                + "- Tính toàn vẹn: Văn bản được ký điện tử và niêm phong bằng mã băm kiểm toán SHA-256 trên hệ thống EVShare 3D.";
    }

    public String buildAmendmentDocumentText(
            String contractCode,
            int versionNumber,
            UUID transferId,
            String fromUserName,
            String fromUserEmail,
            String toUserName,
            String toUserEmail,
            BigDecimal transferPercentage,
            String reason
    ) {
        return buildComprehensiveAmendmentText(
                contractCode,
                versionNumber,
                null,
                transferId,
                "VinFast VF8",
                "30K-123.45",
                "VF8VN2026EV010001",
                fromUserName,
                fromUserEmail,
                null,
                null,
                toUserName,
                toUserEmail,
                null,
                null,
                transferPercentage,
                reason
        );
    }

    public ConsentPolicy resolveTransferConsentPolicy(CoOwnershipGroup group, User fromUser, User toUser) {
        if (group == null || toUser == null) return ConsentPolicy.EXTERNAL_OWNERSHIP_TRANSFER;
        Optional<GroupMember> toMemberOpt = memberRepository.findByGroupIdAndUserId(group.getId(), toUser.getId());
        boolean isExistingActiveMember = toMemberOpt.isPresent()
                && toMemberOpt.get().getStatus() == MemberStatus.ACTIVE
                && toMemberOpt.get().getRemovedAt() == null;
        return isExistingActiveMember ? ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER : ConsentPolicy.EXTERNAL_OWNERSHIP_TRANSFER;
    }

    public boolean checkTransferConsentComplete(OwnershipTransferRequest transfer, CoOwnershipContractVersion version) {
        if (version == null || transfer == null) return false;
        List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(version.getId());
        Set<UUID> validAcceptedUserIds = acceptances.stream()
                .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                .map(a -> a.getUser().getId())
                .collect(Collectors.toSet());

        ConsentPolicy consentPolicy = resolveTransferConsentPolicy(transfer.getGroup(), transfer.getFromUser(), transfer.getToUser());
        if (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER) {
            return validAcceptedUserIds.contains(transfer.getFromUser().getId())
                    && validAcceptedUserIds.contains(transfer.getToUser().getId());
        }

        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(transfer.getGroup().getId(), MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();
        if (activeMembers.isEmpty()) return false;
        return activeMembers.stream().allMatch(m -> validAcceptedUserIds.contains(m.getUser().getId()));
    }

    private OwnershipTransferResponse buildEnrichedTransferResponse(OwnershipTransferRequest entity, UUID currentUserId) {
        if (entity.getContractVersion() == null &&
            (entity.getStatus() == TransferStatus.PENDING_ACCEPTANCE || entity.getStatus() == TransferStatus.PENDING_CONTRACT)) {
            try {
                ensureContractAmendmentVersion(entity, null);
            } catch (Exception ignored) {}
        }

        OwnershipTransferResponse resp = OwnershipTransferResponse.fromEntity(entity, currentUserId);
        if (resp.getContractCode() == null && entity.getGroup() != null) {
            CoOwnershipContract contract = contractRepository.findByGroupId(entity.getGroup().getId()).orElse(null);
            if (contract != null) {
                resp.setContractCode(contract.getContractCode());
            }
        }

        ConsentPolicy consentPolicy = resolveTransferConsentPolicy(entity.getGroup(), entity.getFromUser(), entity.getToUser());
        boolean isInternal = (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER);
        resp.setInternalTransfer(isInternal);
        resp.setConsentPolicy(consentPolicy.name());
        resp.setConsentPolicyLabel(consentPolicy.getDescription());
        resp.setAdditionalApprovalStatus("Không yêu cầu");

        String notifMsg = entity.getFromUser().getFullName() + " đề xuất chuyển nhượng "
                + (entity.getTransferPercentage() != null ? entity.getTransferPercentage().stripTrailingZeros().toPlainString() : "0")
                + " điểm phần trăm sở hữu cho " + entity.getToUser().getFullName() + ".";
        resp.setNotificationMessage(notifMsg);

        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(entity.getGroup().getId(), MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        if (entity.getContractVersion() != null) {
            UUID versionId = entity.getContractVersion().getId();
            CoOwnershipContractVersion version = entity.getContractVersion();
            List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(versionId);

            Set<UUID> validAcceptedUserIds = acceptances.stream()
                    .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                    .map(a -> a.getUser().getId())
                    .collect(Collectors.toSet());

            Map<UUID, Instant> acceptedAtMap = acceptances.stream()
                    .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                    .collect(Collectors.toMap(a -> a.getUser().getId(), ContractAcceptance::getAcceptedAt, (f, s) -> f));

            boolean recipientAccepted = entity.getToUser() != null && validAcceptedUserIds.contains(entity.getToUser().getId());
            boolean transferorAccepted = entity.getFromUser() != null && validAcceptedUserIds.contains(entity.getFromUser().getId());

            resp.setRecipientAccepted(recipientAccepted);
            resp.setTransferorAccepted(transferorAccepted);

            int currentConsentCount = (transferorAccepted ? 1 : 0) + (recipientAccepted ? 1 : 0);
            int requiredConsentCount = isInternal ? 2 : activeMembers.size();

            resp.setCurrentAcceptanceCount(currentConsentCount);
            resp.setRequiredAcceptanceCount(requiredConsentCount);
            resp.setAcceptedMembersCount(isInternal ? currentConsentCount : validAcceptedUserIds.size());
            resp.setAcceptedConsentCount(isInternal ? currentConsentCount : validAcceptedUserIds.size());
            resp.setRequiredConsentCount(requiredConsentCount);
            resp.setTotalMembersCount(requiredConsentCount);

            // Build signatory / parties list
            List<TransferPartyDto> parties = new ArrayList<>();
            BigDecimal fromCur = resolveUserShare(entity.getGroup().getId(), entity.getVehicle().getId(), entity.getFromUser().getId());
            BigDecimal toCur = resolveUserShare(entity.getGroup().getId(), entity.getVehicle().getId(), entity.getToUser().getId());
            BigDecimal fromNext = fromCur.subtract(entity.getTransferPercentage() != null ? entity.getTransferPercentage() : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal toNext = toCur.add(entity.getTransferPercentage() != null ? entity.getTransferPercentage() : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            // Transferor
            parties.add(new TransferPartyDto(
                    entity.getFromUser().getId(),
                    entity.getFromUser().getFullName(),
                    entity.getFromUser().getEmail(),
                    "TRANSFEROR",
                    "Người chuyển",
                    fromCur,
                    fromNext,
                    transferorAccepted,
                    acceptedAtMap.get(entity.getFromUser().getId()),
                    transferorAccepted ? "Đã xác nhận" : "Chờ xác nhận"
            ));

            // Recipient
            parties.add(new TransferPartyDto(
                    entity.getToUser().getId(),
                    entity.getToUser().getFullName(),
                    entity.getToUser().getEmail(),
                    "RECIPIENT",
                    "Người nhận",
                    toCur,
                    toNext,
                    recipientAccepted,
                    acceptedAtMap.get(entity.getToUser().getId()),
                    recipientAccepted ? "Đã xác nhận" : "Chờ xác nhận"
            ));

            // Other co-owners (Le Van C) - Notified only, never fake signed
            for (GroupMember m : activeMembers) {
                if (!m.getUser().getId().equals(entity.getFromUser().getId()) && !m.getUser().getId().equals(entity.getToUser().getId())) {
                    BigDecimal otherCur = resolveUserShare(entity.getGroup().getId(), entity.getVehicle().getId(), m.getUser().getId());
                    parties.add(new TransferPartyDto(
                            m.getUser().getId(),
                            m.getUser().getFullName(),
                            m.getUser().getEmail(),
                            "NOTIFIED_CO_OWNER",
                            "Người liên quan",
                            otherCur,
                            otherCur,
                            false,
                            null,
                            "Được thông báo"
                    ));
                }
            }
            resp.setParties(parties);

            // Determine finalization blockers
            List<String> blockers = new ArrayList<>();
            if (!transferorAccepted) {
                blockers.add("Bên chuyển nhượng chưa xác nhận phụ lục chuyển nhượng.");
            }
            if (!recipientAccepted) {
                blockers.add("Bên nhận chuyển nhượng chưa xác nhận phụ lục chuyển nhượng.");
            }
            if (hasOutstandingObligations(entity.getFromUser().getId())) {
                blockers.add("Người chuyển nhượng còn nghĩa vụ tài chính chưa thanh toán.");
            }
            if (!isInternal) {
                for (GroupMember m : activeMembers) {
                    if (!validAcceptedUserIds.contains(m.getUser().getId())) {
                        blockers.add("Thành viên đồng sở hữu " + m.getUser().getFullName() + " chưa ký xác nhận phụ lục.");
                    }
                }
            }
            resp.setFinalizationBlockers(blockers);

            boolean consentComplete = isInternal ? (transferorAccepted && recipientAccepted) : (validAcceptedUserIds.size() >= activeMembers.size());
            boolean finOk = !hasOutstandingObligations(entity.getFromUser().getId());
            boolean canFinalize = consentComplete && finOk && blockers.isEmpty();

            if (entity.getStatus() == TransferStatus.COMPLETED) {
                resp.setStatusVi("CHUYỂN NHƯỢNG THÀNH CÔNG");
                resp.setAcceptanceStatus("CHUYỂN NHƯỢNG THÀNH CÔNG");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else if (entity.getStatus() == TransferStatus.REJECTED) {
                resp.setStatusVi("BỊ TỪ CHỐI");
                resp.setAcceptanceStatus("BỊ TỪ CHỐI");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else if (entity.getStatus() == TransferStatus.CANCELLED) {
                resp.setStatusVi("ĐÃ HỦY");
                resp.setAcceptanceStatus("ĐÃ HỦY");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else if (canFinalize) {
                resp.setStatusVi("ĐỦ ĐIỀU KIỆN HOÀN TẤT");
                resp.setAcceptanceStatus("ĐỦ ĐIỀU KIỆN HOÀN TẤT");
                resp.setCanComplete(true);
                resp.setCanFinalize(true);
            } else if (consentComplete) {
                resp.setStatusVi("CHỜ HOÀN TẤT ĐIỀU KIỆN");
                resp.setAcceptanceStatus("CHỜ HOÀN TẤT ĐIỀU KIỆN");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else if (transferorAccepted && !recipientAccepted) {
                resp.setStatusVi("CHỜ NGƯỜI NHẬN XÁC NHẬN");
                resp.setAcceptanceStatus("CHỜ NGƯỜI NHẬN XÁC NHẬN");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else if (!transferorAccepted && recipientAccepted) {
                resp.setStatusVi("CHỜ NGƯỜI CHUYỂN XÁC NHẬN");
                resp.setAcceptanceStatus("CHỜ NGƯỜI CHUYỂN XÁC NHẬN");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            } else {
                resp.setStatusVi("CHỜ XÁC NHẬN CỦA HAI BÊN");
                resp.setAcceptanceStatus("CHỜ XÁC NHẬN CỦA HAI BÊN");
                resp.setCanComplete(false);
                resp.setCanFinalize(false);
            }

            if (currentUserId != null) {
                boolean isRecipient = currentUserId.equals(resp.getToUserId());
                boolean isTransferor = currentUserId.equals(resp.getFromUserId());
                String st = entity.getStatus() != null ? entity.getStatus().name() : resp.getStatus();
                boolean isPending = "PENDING_ACCEPTANCE".equals(st) || "PENDING_CONTRACT".equals(st);
                boolean currentUserCanAccept = isPending && ((isRecipient && !recipientAccepted) || (isTransferor && !transferorAccepted));
                boolean currentUserAccepted = isTransferor ? transferorAccepted : (isRecipient ? recipientAccepted : false);
                resp.setCurrentUserAccepted(currentUserAccepted);
                resp.setCurrentUserCanAccept(currentUserCanAccept);
                resp.setCanAccept(currentUserCanAccept);
                resp.setCanReject(isRecipient && !recipientAccepted && isPending);
                resp.setCanCancel(isTransferor && !resp.isCanComplete() && !"COMPLETED".equals(st));

                List<String> nextActions = new ArrayList<>();
                if (entity.getStatus() == TransferStatus.COMPLETED) {
                    nextActions.add("Chuyển nhượng thành công.");
                } else if (entity.getStatus() == TransferStatus.REJECTED) {
                    nextActions.add("Yêu cầu đã bị từ chối.");
                } else if (entity.getStatus() == TransferStatus.CANCELLED) {
                    nextActions.add("Yêu cầu đã bị hủy.");
                } else {
                    if (!transferorAccepted) {
                        if (isTransferor) {
                            nextActions.add("Bạn cần xem phụ lục và bấm 'XÁC NHẬN PHỤ LỤC'.");
                        } else {
                            nextActions.add("Chờ bên chuyển nhượng xác nhận phụ lục.");
                        }
                    }
                    if (!recipientAccepted) {
                        if (isRecipient) {
                            nextActions.add("Bạn cần xem phụ lục và bấm 'ĐỒNG Ý NHẬN CHUYỂN NHƯỢNG'.");
                        } else {
                            nextActions.add("Chờ bên nhận xác nhận phụ lục.");
                        }
                    }
                    if (transferorAccepted && recipientAccepted) {
                        if (!blockers.isEmpty()) {
                            nextActions.add("Chờ hoàn tất các điều kiện tài chính hoặc phê duyệt trước khi kích hoạt.");
                        } else {
                            nextActions.add("Đủ điều kiện hoàn tất. Hệ thống sẵn sàng kích hoạt.");
                        }
                    }
                }
                resp.setNextRequiredActions(nextActions);
            }
        }
        return resp;
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
        String ua = request.getHeader("User-Agent");
        return ua != null ? (ua.length() > 250 ? ua.substring(0, 250) : ua) : "Web-Browser";
    }

    private String buildOwnershipSnapshotJson(UUID groupId, UUID vehicleId) {
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        List<Map<String, Object>> snapshot = new ArrayList<>();
        for (GroupMember m : activeMembers) {
            BigDecimal percentage = resolveUserShare(groupId, vehicleId, m.getUser().getId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", m.getUser().getId().toString());
            map.put("fullName", m.getUser().getFullName());
            map.put("email", m.getUser().getEmail());
            map.put("role", m.getMemberRole() != null ? m.getMemberRole().name() : "MEMBER");
            map.put("percentage", percentage);
            snapshot.add(map);
        }
        return toJson(snapshot);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String calculateSha256(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
