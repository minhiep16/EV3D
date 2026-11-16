package com.evshare.ownership.dto;

public record InvitationSignRequest(
        String pinOrPassword,
        String signatureMethod,
        String fullName,
        String contentHash
) {
}
