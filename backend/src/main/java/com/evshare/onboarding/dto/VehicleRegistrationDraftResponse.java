package com.evshare.onboarding.dto;

import com.evshare.onboarding.entity.DraftStatus;
import com.evshare.onboarding.entity.VehicleRegistrationDraft;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

public record VehicleRegistrationDraftResponse(
        UUID id,
        UUID userId,
        UUID creatorId,
        String creatorName,
        String creatorEmail,
        String vehicleName,
        String manufacturer,
        String model,
        Integer modelYear,
        Integer manufactureYear,
        String licensePlate,
        String plateNumber,
        String vin,
        BigDecimal batteryCapacity,
        BigDecimal batteryCapacityKwh,
        String batteryType,
        String exteriorColor,
        BigDecimal vehicleValue,
        String registrationCity,
        String model3dUrl,
        String groupName,
        BigDecimal monthlyFundContribution,
        BigDecimal latePaymentFeeRate,
        BigDecimal maintenanceReserveRate,
        Integer maxConsecutiveBookingDays,
        Integer currentStep,
        String votingRule,
        BigDecimal quorumPercentage,
        BigDecimal approvalThresholdPercentage,
        String proposedCoOwners,
        List<Map<String, Object>> coOwners,
        DraftStatus status,
        Instant submittedAt,
        UUID reviewedBy,
        String reviewerName,
        Instant reviewedAt,
        String reviewDecision,
        String reviewReason,
        String adminReviewNotes,
        UUID createdVehicleId,
        UUID createdGroupId,
        Instant createdAt,
        Instant updatedAt
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static VehicleRegistrationDraftResponse fromEntity(VehicleRegistrationDraft draft) {
        return fromEntity(draft, null, null, null, null, null);
    }

    public static VehicleRegistrationDraftResponse fromEntity(
            VehicleRegistrationDraft draft,
            String creatorName,
            String creatorEmail,
            String reviewerName
    ) {
        return fromEntity(draft, null, creatorName, creatorEmail, reviewerName, null);
    }

    public static VehicleRegistrationDraftResponse fromEntity(
            VehicleRegistrationDraft draft,
            List<Map<String, Object>> coOwners,
            String creatorName,
            String creatorEmail,
            String reviewerName,
            String model3dUrl
    ) {
        if (draft == null) return null;

        BigDecimal val = draft.getVehicleValue() != null ? draft.getVehicleValue() : new BigDecimal("1200000000.00");
        BigDecimal bat = draft.getBatteryCapacity() != null ? draft.getBatteryCapacity() : new BigDecimal("87.70");
        Integer yr = draft.getModelYear() != null ? draft.getModelYear() : 2025;
        String plate = draft.getLicensePlate() != null ? draft.getLicensePlate() : "";
        BigDecimal monthlyFund = draft.getMonthlyFundContribution() != null
                ? draft.getMonthlyFundContribution()
                : new BigDecimal("2000000.00");
        BigDecimal lateFee = draft.getLatePaymentFeeRate() != null
                ? draft.getLatePaymentFeeRate()
                : new BigDecimal("0.0500");
        BigDecimal maintRate = draft.getMaintenanceReserveRate() != null
                ? draft.getMaintenanceReserveRate()
                : new BigDecimal("0.1500");
        Integer maxDays = draft.getMaxConsecutiveBookingDays() != null ? draft.getMaxConsecutiveBookingDays() : 7;
        Integer step = draft.getCurrentStep() != null ? draft.getCurrentStep() : 1;

        List<Map<String, Object>> parsedOwners = (coOwners != null && !coOwners.isEmpty())
                ? normalizeCoOwnersList(coOwners, val)
                : parseCoOwners(draft.getProposedCoOwners(), val);

        String resolved3dUrl = (model3dUrl != null && !model3dUrl.isBlank())
                ? model3dUrl
                : draft.getModel3dUrl();

        return new VehicleRegistrationDraftResponse(
                draft.getId(),
                draft.getUserId(),
                draft.getUserId(),
                creatorName != null ? creatorName : "Chủ xe đăng ký",
                creatorEmail != null ? creatorEmail : "",
                draft.getVehicleName(),
                draft.getManufacturer() != null && !draft.getManufacturer().isBlank()
                        ? draft.getManufacturer()
                        : resolveBrandFromModel(draft.getModel()),
                draft.getModel() != null ? draft.getModel() : draft.getVehicleName(),
                yr,
                yr,
                plate,
                plate,
                draft.getVin() != null ? draft.getVin() : "",
                bat,
                bat,
                draft.getBatteryType(),
                draft.getExteriorColor(),
                val,
                draft.getRegistrationCity() != null && !draft.getRegistrationCity().isBlank()
                        ? draft.getRegistrationCity()
                        : "Hà Nội",
                resolved3dUrl,
                draft.getGroupName() != null ? draft.getGroupName() : ("Nhóm Đồng Sở Hữu " + (draft.getModel() != null ? draft.getModel() : draft.getVehicleName())),
                monthlyFund,
                lateFee,
                maintRate,
                maxDays,
                step,
                draft.getVotingRule(),
                draft.getQuorumPercentage(),
                draft.getApprovalThresholdPercentage(),
                draft.getProposedCoOwners(),
                parsedOwners,
                draft.getStatus(),
                draft.getSubmittedAt(),
                draft.getReviewedBy(),
                reviewerName,
                draft.getReviewedAt(),
                draft.getReviewDecision(),
                draft.getReviewReason(),
                draft.getReviewReason(),
                draft.getCreatedVehicleId(),
                draft.getCreatedGroupId(),
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }

    private static String resolveBrandFromModel(String model) {
        if (model == null || model.isBlank()) return "VinFast";
        String lower = model.trim().toLowerCase();
        if (lower.startsWith("hyundai") || lower.contains("mistra") || lower.contains("kona")) return "Hyundai";
        if (lower.startsWith("tesla") || lower.contains("cybertruck") || lower.contains("roadster") || lower.contains("model ")) return "Tesla";
        if (lower.startsWith("volvo") || lower.contains("ex30")) return "Volvo";
        if (lower.startsWith("volkswagen") || lower.startsWith("vw") || lower.contains("teramont") || lower.contains("tiguan") || lower.contains("golf")) return "Volkswagen";
        return "VinFast";
    }

    private static List<Map<String, Object>> normalizeCoOwnersList(List<Map<String, Object>> rawList, BigDecimal vehicleValue) {
        if (rawList == null || rawList.isEmpty()) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> normalized = new ArrayList<>();
        for (int i = 0; i < rawList.size(); i++) {
            Map<String, Object> item = rawList.get(i);
            if (item == null) continue;
            Map<String, Object> row = new LinkedHashMap<>(item);
            String fullName = item.get("fullName") != null
                    ? item.get("fullName").toString()
                    : (item.get("name") != null ? item.get("name").toString() : "");
            String email = item.get("email") != null ? item.get("email").toString() : "";
            Object pctObj = item.get("sharePercentage") != null ? item.get("sharePercentage") : item.get("percentage");
            BigDecimal pct = BigDecimal.ZERO;
            if (pctObj != null) {
                try {
                    pct = new BigDecimal(pctObj.toString());
                } catch (Exception ignored) {
                }
            }
            BigDecimal contrib = vehicleValue.multiply(pct).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
            row.put("fullName", fullName);
            row.put("email", email);
            row.put("sharePercentage", pct);
            row.put("percentage", pct);
            if (row.get("contributionAmount") == null) {
                row.put("contributionAmount", contrib);
            }
            if (row.get("role") == null) {
                row.put("role", i == 0 ? "REPRESENTATIVE" : "CO_OWNER");
            }
            row.put("isVerifiedAccount", row.get("userId") != null || i == 0);
            normalized.add(row);
        }
        return normalized;
    }

    private static List<Map<String, Object>> parseCoOwners(String json, BigDecimal vehicleValue) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<Map<String, Object>> rawList = MAPPER.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
            return normalizeCoOwnersList(rawList, vehicleValue);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
