package com.evshare.ownership.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "group_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_group_member", columnNames = {"group_id", "user_id"})
})
public class GroupMember {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CoOwnershipGroup group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", length = 30, nullable = false)
    private GroupMemberRole memberRole = GroupMemberRole.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private MemberStatus status = MemberStatus.ACTIVE;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OwnershipShare> shares = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private Instant joinedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public GroupMember() {
    }

    public GroupMember(UUID id, CoOwnershipGroup group, User user, MemberStatus status) {
        this(id, group, user, GroupMemberRole.MEMBER, status);
    }

    public GroupMember(UUID id, CoOwnershipGroup group, User user, GroupMemberRole memberRole, MemberStatus status) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.user = user;
        this.memberRole = memberRole != null ? memberRole : GroupMemberRole.MEMBER;
        this.status = status != null ? status : MemberStatus.ACTIVE;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public GroupMemberRole getMemberRole() {
        return memberRole;
    }

    public void setMemberRole(GroupMemberRole memberRole) {
        this.memberRole = memberRole;
    }

    public MemberStatus getStatus() {
        return status;
    }

    public void setStatus(MemberStatus status) {
        this.status = status;
    }

    public List<OwnershipShare> getShares() {
        return shares;
    }

    public void setShares(List<OwnershipShare> shares) {
        this.shares = shares;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
