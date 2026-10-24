package com.evshare.contract.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "co_ownership_contract_versions")
public class CoOwnershipContractVersion implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private CoOwnershipContract contract;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "content_snapshot", columnDefinition = "LONGTEXT", nullable = false)
    private String contentSnapshot;

    @Column(name = "content_hash", length = 64, nullable = false)
    private String contentHash;

    @Column(name = "ownership_snapshot", columnDefinition = "TEXT", nullable = false)
    private String ownershipSnapshot;

    @Column(name = "voting_rule_snapshot", columnDefinition = "TEXT", nullable = false)
    private String votingRuleSnapshot;

    @Column(name = "financial_rule_snapshot", columnDefinition = "TEXT", nullable = false)
    private String financialRuleSnapshot;

    @Column(name = "effective_from")
    private Instant effectiveFrom;

    @Column(name = "effective_until")
    private Instant effectiveUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ContractVersionStatus status = ContractVersionStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @OneToMany(mappedBy = "contractVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContractAcceptance> acceptances = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "activated_at")
    private Instant activatedAt;

    public CoOwnershipContractVersion() {
    }

    public CoOwnershipContractVersion(
            UUID id,
            CoOwnershipContract contract,
            Integer versionNumber,
            String title,
            String contentSnapshot,
            String contentHash,
            String ownershipSnapshot,
            String votingRuleSnapshot,
            String financialRuleSnapshot,
            User createdByUser
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.contract = contract;
        this.versionNumber = versionNumber;
        this.title = title;
        this.contentSnapshot = contentSnapshot;
        this.contentHash = contentHash;
        this.ownershipSnapshot = ownershipSnapshot;
        this.votingRuleSnapshot = votingRuleSnapshot;
        this.financialRuleSnapshot = financialRuleSnapshot;
        this.createdByUser = createdByUser;
        this.status = ContractVersionStatus.DRAFT;
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

    public CoOwnershipContract getContract() {
        return contract;
    }

    public void setContract(CoOwnershipContract contract) {
        this.contract = contract;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public String getVersionNumberFormatted() {
        return "V" + versionNumber + ".0";
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContentSnapshot() {
        return contentSnapshot;
    }

    public void setContentSnapshot(String contentSnapshot) {
        this.contentSnapshot = contentSnapshot;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getOwnershipSnapshot() {
        return ownershipSnapshot;
    }

    public void setOwnershipSnapshot(String ownershipSnapshot) {
        this.ownershipSnapshot = ownershipSnapshot;
    }

    public String getVotingRuleSnapshot() {
        return votingRuleSnapshot;
    }

    public void setVotingRuleSnapshot(String votingRuleSnapshot) {
        this.votingRuleSnapshot = votingRuleSnapshot;
    }

    public String getFinancialRuleSnapshot() {
        return financialRuleSnapshot;
    }

    public void setFinancialRuleSnapshot(String financialRuleSnapshot) {
        this.financialRuleSnapshot = financialRuleSnapshot;
    }

    public Instant getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(Instant effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public Instant getEffectiveUntil() {
        return effectiveUntil;
    }

    public void setEffectiveUntil(Instant effectiveUntil) {
        this.effectiveUntil = effectiveUntil;
    }

    public ContractVersionStatus getStatus() {
        return status;
    }

    public void setStatus(ContractVersionStatus status) {
        this.status = status;
    }

    public User getCreatedByUser() {
        return createdByUser;
    }

    public void setCreatedByUser(User createdByUser) {
        this.createdByUser = createdByUser;
    }

    public List<ContractAcceptance> getAcceptances() {
        return acceptances;
    }

    public void setAcceptances(List<ContractAcceptance> acceptances) {
        this.acceptances = acceptances;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(Instant activatedAt) {
        this.activatedAt = activatedAt;
    }
}
