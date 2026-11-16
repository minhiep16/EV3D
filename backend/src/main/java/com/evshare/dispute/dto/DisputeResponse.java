package com.evshare.dispute.dto;

import com.evshare.dispute.entity.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record DisputeResponse(
        UUID id,
        String referenceCode,
        UUID vehicleId,
        String vehicleName,
        String licensePlate,
        UUID coOwnershipGroupId,
        String coOwnershipGroupName,
        UUID createdByUserId,
        String createdByUserName,
        String createdByUserEmail,
        UUID assignedStaffId,
        String assignedStaffName,
        DisputeCategory category,
        String categoryVi,
        DisputePriority priority,
        String priorityVi,
        DisputeStatus status,
        String statusVi,
        String title,
        String description,

        // Investigation fields
        InvestigationConclusion investigationConclusion,
        String investigationConclusionVi,
        String investigationNotes,
        UUID investigatedByUserId,
        String investigatedByName,
        Instant investigatedAt,

        UUID bookingId,
        UUID tripId,
        UUID handoverId,
        UUID inspectionId,
        UUID damageRecordId,
        UUID expenseId,
        UUID expenseShareId,
        UUID personalPaymentId,
        UUID proposalId,
        UUID ownershipTransferId,
        BigDecimal disputedAmount,

        String evidenceSnapshotJson,

        // Resolution & Proposal
        ResolutionType resolutionType,
        String resolutionTypeVi,
        BigDecimal proposedAmount,
        BigDecimal approvedAmount,
        BigDecimal verifiedPaidAmount,
        BigDecimal outstandingAmount,
        PayerType proposedPayerType,
        UUID proposedPayerUserId,
        String proposedPayerName,
        UUID proposedRecipientUserId,
        String proposedRecipientName,
        String decisionBasis,
        Instant resolutionDeadline,

        String proposedResolution,
        String proposedResolutionByName,
        Instant proposedResolutionAt,
        Boolean resolutionAcceptedByParties,

        boolean correctiveActionExecuted,
        String correctiveActionSummary,
        Instant correctiveActionExecutedAt,

        String resolutionSummary,
        Instant resolvedAt,
        Instant closedAt,
        int reopenCount,
        String reopenReason,

        List<DisputeParticipantDto> participants,
        List<DisputeEvidenceDto> evidences,
        List<DisputeMessageDto> messages,
        List<DisputeCompensationDto> compensations,
        List<DisputeActionLogDto> actionLogs,

        String userRoleInDispute,
        boolean canReview,
        boolean canProposeResolution,
        boolean canRespondToResolution,
        boolean canExecuteCorrectiveAction,
        boolean canClose,
        boolean canReopen,

        Long version,
        Instant createdAt,
        Instant updatedAt
) {
    public static DisputeResponse fromEntity(Dispute dispute, UUID currentUserId, boolean isStaffOrAdmin) {
        if (dispute == null) return null;

        List<DisputeParticipantDto> participantDtos = dispute.getParticipants() != null
                ? dispute.getParticipants().stream().map(DisputeParticipantDto::fromEntity).collect(Collectors.toList())
                : List.of();

        List<DisputeEvidenceDto> evidenceDtos = dispute.getEvidences() != null
                ? dispute.getEvidences().stream().map(DisputeEvidenceDto::fromEntity).collect(Collectors.toList())
                : List.of();

        List<DisputeMessageDto> messageDtos = dispute.getMessages() != null
                ? dispute.getMessages().stream()
                    .filter(m -> isStaffOrAdmin || m.getVisibility() == DisputeMessageVisibility.PUBLIC)
                    .map(DisputeMessageDto::fromEntity)
                    .collect(Collectors.toList())
                : List.of();

        List<DisputeCompensationDto> compensationDtos = dispute.getCompensations() != null
                ? dispute.getCompensations().stream().map(DisputeCompensationDto::fromEntity).collect(Collectors.toList())
                : List.of();

        List<DisputeActionLogDto> actionLogDtos = dispute.getActionLogs() != null
                ? dispute.getActionLogs().stream().map(DisputeActionLogDto::fromEntity).collect(Collectors.toList())
                : List.of();

        // Determine user role in this dispute
        String userRole = "NONE";
        if (isStaffOrAdmin) {
            userRole = "STAFF_MEDIATOR";
        } else if (currentUserId != null) {
            if (dispute.getCreatedBy() != null && dispute.getCreatedBy().getId().equals(currentUserId)) {
                userRole = "COMPLAINANT";
            } else {
                var match = participantDtos.stream().filter(p -> currentUserId.equals(p.userId())).findFirst();
                if (match.isPresent()) {
                    userRole = match.get().role().name();
                }
            }
        }

        boolean isTerminal = dispute.getStatus() == DisputeStatus.RESOLVED
                || dispute.getStatus() == DisputeStatus.CLOSED
                || dispute.getStatus() == DisputeStatus.REJECTED;

        boolean canReview = isStaffOrAdmin && (dispute.getStatus() == DisputeStatus.SUBMITTED || dispute.getStatus() == DisputeStatus.AWAITING_EVIDENCE);
        boolean canPropose = isStaffOrAdmin && (dispute.getStatus() == DisputeStatus.UNDER_REVIEW || dispute.getStatus() == DisputeStatus.MEDIATION);
        
        boolean canRespond = !isStaffOrAdmin && dispute.getStatus() == DisputeStatus.PROPOSED_RESOLUTION && currentUserId != null &&
                (currentUserId.equals(dispute.getCreatedBy().getId()) ||
                 participantDtos.stream().anyMatch(p -> currentUserId.equals(p.userId()) && (p.hasAcceptedResolution() == null)));

        boolean canExecute = isStaffOrAdmin && dispute.getStatus() == DisputeStatus.RESOLVED && !dispute.isCorrectiveActionExecuted();
        boolean canClose = isStaffOrAdmin && !isTerminal;
        boolean canReopen = (isStaffOrAdmin || (currentUserId != null && currentUserId.equals(dispute.getCreatedBy().getId())))
                && isTerminal && dispute.getReopenCount() < 2;

        return new DisputeResponse(
                dispute.getId(),
                dispute.getReferenceCode(),
                dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                dispute.getVehicle() != null ? dispute.getVehicle().getName() : null,
                dispute.getVehicle() != null ? dispute.getVehicle().getLicensePlate() : null,
                dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getName() : null,
                dispute.getCreatedBy() != null ? dispute.getCreatedBy().getId() : null,
                dispute.getCreatedBy() != null ? dispute.getCreatedBy().getFullName() : null,
                dispute.getCreatedBy() != null ? dispute.getCreatedBy().getEmail() : null,
                dispute.getAssignedStaff() != null ? dispute.getAssignedStaff().getId() : null,
                dispute.getAssignedStaff() != null ? dispute.getAssignedStaff().getFullName() : null,
                dispute.getCategory(),
                dispute.getCategory() != null ? dispute.getCategory().getVietnameseLabel() : null,
                dispute.getPriority(),
                dispute.getPriority() != null ? dispute.getPriority().getVietnameseLabel() : null,
                dispute.getStatus(),
                dispute.getStatus() != null ? dispute.getStatus().getVietnameseLabel() : null,
                dispute.getTitle(),
                dispute.getDescription(),

                dispute.getInvestigationConclusion(),
                dispute.getInvestigationConclusion() != null ? dispute.getInvestigationConclusion().getVietnameseLabel() : null,
                dispute.getInvestigationNotes(),
                dispute.getInvestigatedBy() != null ? dispute.getInvestigatedBy().getId() : null,
                dispute.getInvestigatedBy() != null ? dispute.getInvestigatedBy().getFullName() : null,
                dispute.getInvestigatedAt(),

                dispute.getBookingId(),
                dispute.getTripId(),
                dispute.getHandoverId(),
                dispute.getInspectionId(),
                dispute.getDamageRecordId(),
                dispute.getExpenseId(),
                dispute.getExpenseShareId(),
                dispute.getPersonalPaymentId(),
                dispute.getProposalId(),
                dispute.getOwnershipTransferId(),
                dispute.getDisputedAmount(),

                dispute.getEvidenceSnapshotJson(),

                dispute.getResolutionType(),
                dispute.getResolutionType() != null ? dispute.getResolutionType().getVietnameseLabel() : null,
                dispute.getProposedAmount(),
                dispute.getApprovedAmount(),
                dispute.getVerifiedPaidAmount(),
                dispute.getOutstandingAmount(),
                dispute.getProposedPayerType(),
                dispute.getProposedPayerUser() != null ? dispute.getProposedPayerUser().getId() : null,
                dispute.getProposedPayerName(),
                dispute.getProposedRecipientUser() != null ? dispute.getProposedRecipientUser().getId() : null,
                dispute.getProposedRecipientName(),
                dispute.getDecisionBasis(),
                dispute.getResolutionDeadline(),

                dispute.getProposedResolution(),
                dispute.getProposedResolutionBy() != null ? dispute.getProposedResolutionBy().getFullName() : null,
                dispute.getProposedResolutionAt(),
                dispute.getResolutionAcceptedByParties(),
                dispute.isCorrectiveActionExecuted(),
                dispute.getCorrectiveActionSummary(),
                dispute.getCorrectiveActionExecutedAt(),
                dispute.getResolutionSummary(),
                dispute.getResolvedAt(),
                dispute.getClosedAt(),
                dispute.getReopenCount(),
                dispute.getReopenReason(),
                participantDtos,
                evidenceDtos,
                messageDtos,
                compensationDtos,
                actionLogDtos,
                userRole,
                canReview,
                canPropose,
                canRespond,
                canExecute,
                canClose,
                canReopen,
                dispute.getVersion(),
                dispute.getCreatedAt(),
                dispute.getUpdatedAt()
        );
    }
}
