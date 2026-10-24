package com.evshare.ownership.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class TransferPartyDto {
    private UUID userId;
    private String fullName;
    private String email;
    private String role; // "TRANSFEROR", "RECIPIENT", "NOTIFIED_CO_OWNER"
    private String roleVi; // "Người chuyển", "Người nhận", "Người liên quan"
    private BigDecimal currentPercentage;
    private BigDecimal proposedPercentage;
    private boolean isConsented;
    private Instant consentedAt;
    private String statusVi; // "Đã xác nhận", "Chờ xác nhận", "Được thông báo"

    public TransferPartyDto() {
    }

    public TransferPartyDto(
            UUID userId,
            String fullName,
            String email,
            String role,
            String roleVi,
            BigDecimal currentPercentage,
            BigDecimal proposedPercentage,
            boolean isConsented,
            Instant consentedAt,
            String statusVi
    ) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.roleVi = roleVi;
        this.currentPercentage = currentPercentage;
        this.proposedPercentage = proposedPercentage;
        this.isConsented = isConsented;
        this.consentedAt = consentedAt;
        this.statusVi = statusVi;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRoleVi() {
        return roleVi;
    }

    public void setRoleVi(String roleVi) {
        this.roleVi = roleVi;
    }

    public BigDecimal getCurrentPercentage() {
        return currentPercentage;
    }

    public void setCurrentPercentage(BigDecimal currentPercentage) {
        this.currentPercentage = currentPercentage;
    }

    public BigDecimal getProposedPercentage() {
        return proposedPercentage;
    }

    public void setProposedPercentage(BigDecimal proposedPercentage) {
        this.proposedPercentage = proposedPercentage;
    }

    @JsonProperty("isConsented")
    public boolean isConsented() {
        return isConsented;
    }

    @JsonProperty("consented")
    public boolean getConsented() {
        return isConsented;
    }

    public void setConsented(boolean consented) {
        this.isConsented = consented;
    }

    public Instant getConsentedAt() {
        return consentedAt;
    }

    public void setConsentedAt(Instant consentedAt) {
        this.consentedAt = consentedAt;
    }

    public String getStatusVi() {
        return statusVi;
    }

    public void setStatusVi(String statusVi) {
        this.statusVi = statusVi;
    }
}
