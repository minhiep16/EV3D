package com.evshare.dispute.entity;

import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "disputes")
public class Dispute implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @Column(name = "reference_code", length = 32, nullable = false, unique = true)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private CoOwnershipGroup coOwnershipGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 40, nullable = false)
    private DisputeCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20, nullable = false)
    private DisputePriority priority = DisputePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private DisputeStatus status = DisputeStatus.SUBMITTED;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    // --- Authoritative Transaction References (UUIDs) ---
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "booking_id", length = 36)
    private UUID bookingId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "trip_id", length = 36)
    private UUID tripId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "handover_id", length = 36)
    private UUID handoverId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "inspection_id", length = 36)
    private UUID inspectionId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "damage_record_id", length = 36)
    private UUID damageRecordId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "expense_id", length = 36)
    private UUID expenseId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "expense_share_id", length = 36)
    private UUID expenseShareId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "personal_payment_id", length = 36)
    private UUID personalPaymentId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "proposal_id", length = 36)
    private UUID proposalId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "ownership_transfer_id", length = 36)
    private UUID ownershipTransferId;

    @Column(name = "disputed_amount", precision = 14, scale = 2)
    private BigDecimal disputedAmount;

    // --- Immutable Historical Evidence Snapshot (Phase 5.5.8) ---
    @Column(name = "evidence_snapshot_json", columnDefinition = "TEXT")
    private String evidenceSnapshotJson;

    // --- Late Return & Incident Investigation (Phase 5.8) ---
    @Enumerated(EnumType.STRING)
    @Column(name = "investigation_conclusion", length = 50)
    private InvestigationConclusion investigationConclusion;

    @Column(name = "investigation_notes", columnDefinition = "TEXT")
    private String investigationNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigated_by_user_id")
    private User investigatedBy;

    @Column(name = "investigated_at")
    private Instant investigatedAt;

    // --- Structured Mediation & Resolution Fields (Phase 5.5.10, 5.5.13, 5.5.19, Phase 5.8) ---
    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_type", length = 50)
    private ResolutionType resolutionType;

    @Column(name = "proposed_amount", precision = 14, scale = 2)
    private BigDecimal proposedAmount;

    @Column(name = "approved_amount", precision = 14, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "verified_paid_amount", precision = 14, scale = 2)
    private BigDecimal verifiedPaidAmount = BigDecimal.ZERO;

    @Column(name = "outstanding_amount", precision = 14, scale = 2)
    private BigDecimal outstandingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "proposed_payer_type", length = 40)
    private PayerType proposedPayerType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_payer_user_id")
    private User proposedPayerUser;

    @Column(name = "proposed_payer_name", length = 255)
    private String proposedPayerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_recipient_user_id")
    private User proposedRecipientUser;

    @Column(name = "proposed_recipient_name", length = 255)
    private String proposedRecipientName;

    @Column(name = "decision_basis", columnDefinition = "TEXT")
    private String decisionBasis;

    @Column(name = "resolution_deadline")
    private Instant resolutionDeadline;

    @Column(name = "proposed_resolution", columnDefinition = "TEXT")
    private String proposedResolution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_resolution_by_user_id")
    private User proposedResolutionBy;

    @Column(name = "proposed_resolution_at")
    private Instant proposedResolutionAt;

    @Column(name = "resolution_accepted_by_parties")
    private Boolean resolutionAcceptedByParties;

    @Column(name = "corrective_action_executed", nullable = false)
    private boolean correctiveActionExecuted = false;

    @Column(name = "corrective_action_summary", columnDefinition = "TEXT")
    private String correctiveActionSummary;

    @Column(name = "corrective_action_executed_at")
    private Instant correctiveActionExecutedAt;

    @Column(name = "resolution_summary", columnDefinition = "TEXT")
    private String resolutionSummary;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "reopen_count", nullable = false)
    private int reopenCount = 0;

    @Column(name = "reopen_reason", columnDefinition = "TEXT")
    private String reopenReason;

    // --- Relationships ---
    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DisputeParticipant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DisputeEvidence> evidences = new ArrayList<>();

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DisputeMessage> messages = new ArrayList<>();

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<DisputeCompensation> compensations = new ArrayList<>();

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<DisputeActionLog> actionLogs = new ArrayList<>();

    @Version
    @Column(name = "version")
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Dispute() {
    }

    public Dispute(UUID id, String referenceCode, Vehicle vehicle, CoOwnershipGroup coOwnershipGroup,
                   User createdBy, DisputeCategory category, String title, String description) {
        this.id = id;
        this.referenceCode = referenceCode;
        this.vehicle = vehicle;
        this.coOwnershipGroup = coOwnershipGroup;
        this.createdBy = createdBy;
        this.category = category;
        this.title = title;
        this.description = description;
        this.status = DisputeStatus.SUBMITTED;
        this.priority = DisputePriority.MEDIUM;
        this.isNew = true;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public CoOwnershipGroup getCoOwnershipGroup() {
        return coOwnershipGroup;
    }

    public void setCoOwnershipGroup(CoOwnershipGroup coOwnershipGroup) {
        this.coOwnershipGroup = coOwnershipGroup;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public User getAssignedStaff() {
        return assignedStaff;
    }

    public void setAssignedStaff(User assignedStaff) {
        this.assignedStaff = assignedStaff;
    }

    public DisputeCategory getCategory() {
        return category;
    }

    public void setCategory(DisputeCategory category) {
        this.category = category;
    }

    public DisputePriority getPriority() {
        return priority;
    }

    public void setPriority(DisputePriority priority) {
        this.priority = priority;
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public UUID getTripId() {
        return tripId;
    }

    public void setTripId(UUID tripId) {
        this.tripId = tripId;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public void setHandoverId(UUID handoverId) {
        this.handoverId = handoverId;
    }

    public UUID getInspectionId() {
        return inspectionId;
    }

    public void setInspectionId(UUID inspectionId) {
        this.inspectionId = inspectionId;
    }

    public UUID getDamageRecordId() {
        return damageRecordId;
    }

    public void setDamageRecordId(UUID damageRecordId) {
        this.damageRecordId = damageRecordId;
    }

    public UUID getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(UUID expenseId) {
        this.expenseId = expenseId;
    }

    public UUID getExpenseShareId() {
        return expenseShareId;
    }

    public void setExpenseShareId(UUID expenseShareId) {
        this.expenseShareId = expenseShareId;
    }

    public UUID getPersonalPaymentId() {
        return personalPaymentId;
    }

    public void setPersonalPaymentId(UUID personalPaymentId) {
        this.personalPaymentId = personalPaymentId;
    }

    public UUID getProposalId() {
        return proposalId;
    }

    public void setProposalId(UUID proposalId) {
        this.proposalId = proposalId;
    }

    public UUID getOwnershipTransferId() {
        return ownershipTransferId;
    }

    public void setOwnershipTransferId(UUID ownershipTransferId) {
        this.ownershipTransferId = ownershipTransferId;
    }

    public BigDecimal getDisputedAmount() {
        return disputedAmount;
    }

    public void setDisputedAmount(BigDecimal disputedAmount) {
        this.disputedAmount = disputedAmount;
    }

    public String getEvidenceSnapshotJson() {
        return evidenceSnapshotJson;
    }

    public void setEvidenceSnapshotJson(String evidenceSnapshotJson) {
        this.evidenceSnapshotJson = evidenceSnapshotJson;
    }

    public String getProposedResolution() {
        return proposedResolution;
    }

    public void setProposedResolution(String proposedResolution) {
        this.proposedResolution = proposedResolution;
    }

    public User getProposedResolutionBy() {
        return proposedResolutionBy;
    }

    public void setProposedResolutionBy(User proposedResolutionBy) {
        this.proposedResolutionBy = proposedResolutionBy;
    }

    public Instant getProposedResolutionAt() {
        return proposedResolutionAt;
    }

    public void setProposedResolutionAt(Instant proposedResolutionAt) {
        this.proposedResolutionAt = proposedResolutionAt;
    }

    public Boolean getResolutionAcceptedByParties() {
        return resolutionAcceptedByParties;
    }

    public void setResolutionAcceptedByParties(Boolean resolutionAcceptedByParties) {
        this.resolutionAcceptedByParties = resolutionAcceptedByParties;
    }

    public boolean isCorrectiveActionExecuted() {
        return correctiveActionExecuted;
    }

    public void setCorrectiveActionExecuted(boolean correctiveActionExecuted) {
        this.correctiveActionExecuted = correctiveActionExecuted;
    }

    public String getCorrectiveActionSummary() {
        return correctiveActionSummary;
    }

    public void setCorrectiveActionSummary(String correctiveActionSummary) {
        this.correctiveActionSummary = correctiveActionSummary;
    }

    public Instant getCorrectiveActionExecutedAt() {
        return correctiveActionExecutedAt;
    }

    public void setCorrectiveActionExecutedAt(Instant correctiveActionExecutedAt) {
        this.correctiveActionExecutedAt = correctiveActionExecutedAt;
    }

    public String getResolutionSummary() {
        return resolutionSummary;
    }

    public void setResolutionSummary(String resolutionSummary) {
        this.resolutionSummary = resolutionSummary;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }

    public int getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(int reopenCount) {
        this.reopenCount = reopenCount;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public List<DisputeParticipant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<DisputeParticipant> participants) {
        this.participants = participants;
    }

    public List<DisputeEvidence> getEvidences() {
        return evidences;
    }

    public void setEvidences(List<DisputeEvidence> evidences) {
        this.evidences = evidences;
    }

    public List<DisputeMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<DisputeMessage> messages) {
        this.messages = messages;
    }

    public InvestigationConclusion getInvestigationConclusion() {
        return investigationConclusion;
    }

    public void setInvestigationConclusion(InvestigationConclusion investigationConclusion) {
        this.investigationConclusion = investigationConclusion;
    }

    public String getInvestigationNotes() {
        return investigationNotes;
    }

    public void setInvestigationNotes(String investigationNotes) {
        this.investigationNotes = investigationNotes;
    }

    public User getInvestigatedBy() {
        return investigatedBy;
    }

    public void setInvestigatedBy(User investigatedBy) {
        this.investigatedBy = investigatedBy;
    }

    public Instant getInvestigatedAt() {
        return investigatedAt;
    }

    public void setInvestigatedAt(Instant investigatedAt) {
        this.investigatedAt = investigatedAt;
    }

    public ResolutionType getResolutionType() {
        return resolutionType;
    }

    public void setResolutionType(ResolutionType resolutionType) {
        this.resolutionType = resolutionType;
    }

    public BigDecimal getProposedAmount() {
        return proposedAmount;
    }

    public void setProposedAmount(BigDecimal proposedAmount) {
        this.proposedAmount = proposedAmount;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public BigDecimal getVerifiedPaidAmount() {
        return verifiedPaidAmount;
    }

    public void setVerifiedPaidAmount(BigDecimal verifiedPaidAmount) {
        this.verifiedPaidAmount = verifiedPaidAmount;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public PayerType getProposedPayerType() {
        return proposedPayerType;
    }

    public void setProposedPayerType(PayerType proposedPayerType) {
        this.proposedPayerType = proposedPayerType;
    }

    public User getProposedPayerUser() {
        return proposedPayerUser;
    }

    public void setProposedPayerUser(User proposedPayerUser) {
        this.proposedPayerUser = proposedPayerUser;
    }

    public String getProposedPayerName() {
        return proposedPayerName;
    }

    public void setProposedPayerName(String proposedPayerName) {
        this.proposedPayerName = proposedPayerName;
    }

    public User getProposedRecipientUser() {
        return proposedRecipientUser;
    }

    public void setProposedRecipientUser(User proposedRecipientUser) {
        this.proposedRecipientUser = proposedRecipientUser;
    }

    public String getProposedRecipientName() {
        return proposedRecipientName;
    }

    public void setProposedRecipientName(String proposedRecipientName) {
        this.proposedRecipientName = proposedRecipientName;
    }

    public String getDecisionBasis() {
        return decisionBasis;
    }

    public void setDecisionBasis(String decisionBasis) {
        this.decisionBasis = decisionBasis;
    }

    public Instant getResolutionDeadline() {
        return resolutionDeadline;
    }

    public void setResolutionDeadline(Instant resolutionDeadline) {
        this.resolutionDeadline = resolutionDeadline;
    }

    public List<DisputeCompensation> getCompensations() {
        return compensations;
    }

    public void setCompensations(List<DisputeCompensation> compensations) {
        this.compensations = compensations;
    }

    public List<DisputeActionLog> getActionLogs() {
        return actionLogs;
    }

    public void setActionLogs(List<DisputeActionLog> actionLogs) {
        this.actionLogs = actionLogs;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

