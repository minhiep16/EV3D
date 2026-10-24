package com.evshare.contract.dto;

public record ContractAcceptanceRequest(
        String contentHash,
        String confirmationNote
) {
}
