package com.evshare.handover.dto;

import java.time.Instant;
import java.util.UUID;

public class VehicleHandoverEligibilityResponse {

    private HandoverEligibilityReason reason;
    private String message;
    private boolean eligibleForInspection;
    private boolean handoverAllowed;
    private boolean inspectionAvailable;
    private UUID inspectionId;
    private String inspectionResult;
    private Instant inspectionCompletedAt;
    private boolean inspectionFresh;
    private Integer inspectedPartsCount;
    private Integer totalAssessmentRecords;
    private Integer uniqueAssessedComponents;
    private Integer requiredComponentCount;
    private Integer assessedRequiredComponentCount;
    private Integer unresolvedCriticalDamageCount;
    private String inspectorName;
    private UUID vehicleId;
    private String vehicleName;
    private String vehicleCode;
    private UUID bookingId;
    private Instant bookingStartTime;
    private Instant bookingEndTime;
    private String recipientName;
    private String recipientEmail;
    private String bookingPurpose;
    private Instant preparationWindowStartTime;
    private Long secondsUntilPreparation;
    private UUID handoverId;
    private String handoverStatus;
    private VehicleHandoverResponse handover;

    private boolean previousCustodyUnresolved;
    private String currentCustodianName;
    private UUID currentCustodianBookingId;
    private Instant currentCustodianExpectedReturnTime;
    private Boolean currentCustodianOverdue;

    public VehicleHandoverEligibilityResponse() {
    }

    public static VehicleHandoverEligibilityResponse notFound(String message) {
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setReason(HandoverEligibilityReason.NO_BOOKING);
        resp.setMessage(message != null ? message : "Không tìm thấy phương tiện với mã định danh cung cấp.");
        resp.setHandoverAllowed(false);
        resp.setEligibleForInspection(false);
        return resp;
    }

    public HandoverEligibilityReason getReason() {
        return reason;
    }

    public void setReason(HandoverEligibilityReason reason) {
        this.reason = reason;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEligibleForInspection() {
        return eligibleForInspection;
    }

    public boolean isEligible() {
        return Boolean.TRUE.equals(this.handoverAllowed);
    }

    public void setEligibleForInspection(boolean eligibleForInspection) {
        this.eligibleForInspection = eligibleForInspection;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getVehicleCode() {
        return vehicleCode != null ? vehicleCode : "EV01";
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public Instant getBookingStartTime() {
        return bookingStartTime;
    }

    public void setBookingStartTime(Instant bookingStartTime) {
        this.bookingStartTime = bookingStartTime;
    }

    public Instant getBookingEndTime() {
        return bookingEndTime;
    }

    public void setBookingEndTime(Instant bookingEndTime) {
        this.bookingEndTime = bookingEndTime;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getBookingPurpose() {
        return bookingPurpose;
    }

    public void setBookingPurpose(String bookingPurpose) {
        this.bookingPurpose = bookingPurpose;
    }

    public Instant getPreparationWindowStartTime() {
        return preparationWindowStartTime;
    }

    public void setPreparationWindowStartTime(Instant preparationWindowStartTime) {
        this.preparationWindowStartTime = preparationWindowStartTime;
    }

    public Long getSecondsUntilPreparation() {
        return secondsUntilPreparation;
    }

    public void setSecondsUntilPreparation(Long secondsUntilPreparation) {
        this.secondsUntilPreparation = secondsUntilPreparation;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public void setHandoverId(UUID handoverId) {
        this.handoverId = handoverId;
    }

    public String getHandoverStatus() {
        return handoverStatus;
    }

    public void setHandoverStatus(String handoverStatus) {
        this.handoverStatus = handoverStatus;
    }

    public VehicleHandoverResponse getHandover() {
        return handover;
    }

    public void setHandover(VehicleHandoverResponse handover) {
        this.handover = handover;
    }

    public boolean isHandoverAllowed() {
        return handoverAllowed;
    }

    public boolean getHandoverAllowed() {
        return handoverAllowed;
    }

    public void setHandoverAllowed(boolean handoverAllowed) {
        this.handoverAllowed = handoverAllowed;
    }

    public boolean isInspectionAvailable() {
        return inspectionAvailable;
    }

    public void setInspectionAvailable(boolean inspectionAvailable) {
        this.inspectionAvailable = inspectionAvailable;
    }

    public UUID getInspectionId() {
        return inspectionId;
    }

    public void setInspectionId(UUID inspectionId) {
        this.inspectionId = inspectionId;
    }

    public String getInspectionResult() {
        return inspectionResult;
    }

    public void setInspectionResult(String inspectionResult) {
        this.inspectionResult = inspectionResult;
    }

    public Instant getInspectionCompletedAt() {
        return inspectionCompletedAt;
    }

    public void setInspectionCompletedAt(Instant inspectionCompletedAt) {
        this.inspectionCompletedAt = inspectionCompletedAt;
    }

    public boolean isInspectionFresh() {
        return inspectionFresh;
    }

    public void setInspectionFresh(boolean inspectionFresh) {
        this.inspectionFresh = inspectionFresh;
    }

    public Integer getInspectedPartsCount() {
        return inspectedPartsCount;
    }

    public void setInspectedPartsCount(Integer inspectedPartsCount) {
        this.inspectedPartsCount = inspectedPartsCount;
    }

    public String getInspectorName() {
        return inspectorName;
    }

    public void setInspectorName(String inspectorName) {
        this.inspectorName = inspectorName;
    }

    public Integer getTotalAssessmentRecords() {
        return totalAssessmentRecords;
    }

    public void setTotalAssessmentRecords(Integer totalAssessmentRecords) {
        this.totalAssessmentRecords = totalAssessmentRecords;
    }

    public Integer getUniqueAssessedComponents() {
        return uniqueAssessedComponents;
    }

    public void setUniqueAssessedComponents(Integer uniqueAssessedComponents) {
        this.uniqueAssessedComponents = uniqueAssessedComponents;
    }

    public Integer getRequiredComponentCount() {
        return requiredComponentCount;
    }

    public void setRequiredComponentCount(Integer requiredComponentCount) {
        this.requiredComponentCount = requiredComponentCount;
    }

    public Integer getAssessedRequiredComponentCount() {
        return assessedRequiredComponentCount;
    }

    public void setAssessedRequiredComponentCount(Integer assessedRequiredComponentCount) {
        this.assessedRequiredComponentCount = assessedRequiredComponentCount;
    }

    public Integer getUnresolvedCriticalDamageCount() {
        return unresolvedCriticalDamageCount;
    }

    public void setUnresolvedCriticalDamageCount(Integer unresolvedCriticalDamageCount) {
        this.unresolvedCriticalDamageCount = unresolvedCriticalDamageCount;
    }

    public boolean isPreviousCustodyUnresolved() {
        return previousCustodyUnresolved;
    }

    public void setPreviousCustodyUnresolved(boolean previousCustodyUnresolved) {
        this.previousCustodyUnresolved = previousCustodyUnresolved;
    }

    public String getCurrentCustodianName() {
        return currentCustodianName;
    }

    public void setCurrentCustodianName(String currentCustodianName) {
        this.currentCustodianName = currentCustodianName;
    }

    public UUID getCurrentCustodianBookingId() {
        return currentCustodianBookingId;
    }

    public void setCurrentCustodianBookingId(UUID currentCustodianBookingId) {
        this.currentCustodianBookingId = currentCustodianBookingId;
    }

    public Instant getCurrentCustodianExpectedReturnTime() {
        return currentCustodianExpectedReturnTime;
    }

    public void setCurrentCustodianExpectedReturnTime(Instant currentCustodianExpectedReturnTime) {
        this.currentCustodianExpectedReturnTime = currentCustodianExpectedReturnTime;
    }

    public Boolean getCurrentCustodianOverdue() {
        return currentCustodianOverdue;
    }

    public void setCurrentCustodianOverdue(Boolean currentCustodianOverdue) {
        this.currentCustodianOverdue = currentCustodianOverdue;
    }
}
