package com.evshare.ownership.dto;

public record AcceptTransferConsentRequest(
        String contentHash,
        String confirmationNote,
        Boolean acknowledgedTerms
) {
}
