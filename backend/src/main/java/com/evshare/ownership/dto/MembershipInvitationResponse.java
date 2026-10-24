package com.evshare.ownership.dto;

import com.evshare.ownership.entity.MembershipInvitation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class MembershipInvitationResponse {

    private UUID id;
    private UUID groupId;
    private String groupName;
    private UUID vehicleId;
    private String vehicleName;
    private UUID invitedByUserId;
    private String invitedByUserName;
    private String inviteeEmail;
    private UUID inviteeUserId;
    private String inviteeUserName;
    private BigDecimal proposedPercentage;
    private String status;
    private String statusVi;
    private String invitationNote;
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant expiresAt;

    public MembershipInvitationResponse() {
    }

    public static MembershipInvitationResponse fromEntity(MembershipInvitation entity) {
        MembershipInvitationResponse resp = new MembershipInvitationResponse();
        resp.setId(entity.getId());
        if (entity.getGroup() != null) {
            resp.setGroupId(entity.getGroup().getId());
            resp.setGroupName(entity.getGroup().getName());
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
        }
        if (entity.getInvitedByUser() != null) {
            resp.setInvitedByUserId(entity.getInvitedByUser().getId());
            resp.setInvitedByUserName(entity.getInvitedByUser().getFullName());
        }
        resp.setInviteeEmail(entity.getInviteeEmail());
        if (entity.getInviteeUser() != null) {
            resp.setInviteeUserId(entity.getInviteeUser().getId());
            resp.setInviteeUserName(entity.getInviteeUser().getFullName());
        }
        resp.setProposedPercentage(entity.getProposedPercentage());
        if (entity.getStatus() != null) {
            resp.setStatus(entity.getStatus().name());
            resp.setStatusVi(entity.getStatus().getVietnameseLabel());
        }
        resp.setInvitationNote(entity.getInvitationNote());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setAcceptedAt(entity.getAcceptedAt());
        resp.setExpiresAt(entity.getExpiresAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
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

    public UUID getInvitedByUserId() {
        return invitedByUserId;
    }

    public void setInvitedByUserId(UUID invitedByUserId) {
        this.invitedByUserId = invitedByUserId;
    }

    public String getInvitedByUserName() {
        return invitedByUserName;
    }

    public void setInvitedByUserName(String invitedByUserName) {
        this.invitedByUserName = invitedByUserName;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public UUID getInviteeUserId() {
        return inviteeUserId;
    }

    public void setInviteeUserId(UUID inviteeUserId) {
        this.inviteeUserId = inviteeUserId;
    }

    public String getInviteeUserName() {
        return inviteeUserName;
    }

    public void setInviteeUserName(String inviteeUserName) {
        this.inviteeUserName = inviteeUserName;
    }

    public BigDecimal getProposedPercentage() {
        return proposedPercentage;
    }

    public void setProposedPercentage(BigDecimal proposedPercentage) {
        this.proposedPercentage = proposedPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusVi() {
        return statusVi;
    }

    public void setStatusVi(String statusVi) {
        this.statusVi = statusVi;
    }

    public String getInvitationNote() {
        return invitationNote;
    }

    public void setInvitationNote(String invitationNote) {
        this.invitationNote = invitationNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
