package com.evshare.contract.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_acceptances")
public class ContractAcceptance implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_version_id", nullable = false)
    private CoOwnershipContractVersion contractVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private AcceptanceStatus status = AcceptanceStatus.ACCEPTED;

    @Column(name = "accepted_at", nullable = false)
    private Instant acceptedAt;

    @Column(name = "content_hash_at_acceptance", length = 64, nullable = false)
    private String contentHashAtAcceptance;

    @Column(name = "acceptance_method", length = 50, nullable = false)
    private String acceptanceMethod = "DEMO_ELECTRONIC_ACCEPTANCE";

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ContractAcceptance() {
    }

    public ContractAcceptance(
            UUID id,
            CoOwnershipContractVersion contractVersion,
            User user,
            String contentHashAtAcceptance,
            String acceptanceMethod,
            String ipAddress,
            String userAgent
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.contractVersion = contractVersion;
        this.user = user;
        this.contentHashAtAcceptance = contentHashAtAcceptance;
        this.acceptanceMethod = acceptanceMethod != null ? acceptanceMethod : "DEMO_ELECTRONIC_ACCEPTANCE";
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.status = AcceptanceStatus.ACCEPTED;
        this.acceptedAt = Instant.now();
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

    public CoOwnershipContractVersion getContractVersion() {
        return contractVersion;
    }

    public void setContractVersion(CoOwnershipContractVersion contractVersion) {
        this.contractVersion = contractVersion;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public AcceptanceStatus getStatus() {
        return status;
    }

    public void setStatus(AcceptanceStatus status) {
        this.status = status;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public String getContentHashAtAcceptance() {
        return contentHashAtAcceptance;
    }

    public void setContentHashAtAcceptance(String contentHashAtAcceptance) {
        this.contentHashAtAcceptance = contentHashAtAcceptance;
    }

    public String getAcceptanceMethod() {
        return acceptanceMethod;
    }

    public void setAcceptanceMethod(String acceptanceMethod) {
        this.acceptanceMethod = acceptanceMethod;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
