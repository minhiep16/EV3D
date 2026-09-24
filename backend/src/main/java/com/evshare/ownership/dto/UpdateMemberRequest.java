package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.MemberStatus;

public record UpdateMemberRequest(
        GroupMemberRole memberRole,
        MemberStatus status
) {}
