package com.evshare.ownership.dto;

public record ReviewWithdrawalRequest(
        boolean approve,
        String rejectionReason
) {
}
