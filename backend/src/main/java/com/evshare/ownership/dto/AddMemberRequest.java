package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.MemberStatus;

import java.util.UUID;

public record AddMemberRequest(
        UUID userId,
        String email,
        GroupMemberRole memberRole,
        MemberStatus status
) {
    public AddMemberRequest(UUID userId) {
        this(userId, null, GroupMemberRole.MEMBER, MemberStatus.ACTIVE);
    }

    public AddMemberRequest(String email) {
        this(null, email, GroupMemberRole.MEMBER, MemberStatus.ACTIVE);
    }

    public AddMemberRequest(UUID userId, GroupMemberRole memberRole, MemberStatus status) {
        this(userId, null, memberRole, status);
    }
}
