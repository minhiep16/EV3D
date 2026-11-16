package com.evshare.dispute.dto;

import java.util.Map;

public record DisputeSummaryResponse(
        long totalDisputes,
        long submittedCount,
        long underReviewCount,
        long awaitingEvidenceCount,
        long mediationCount,
        long proposedResolutionCount,
        long votingInProgressCount,
        long resolvedCount,
        long closedCount,
        long rejectedCount,
        Map<String, Long> countByCategory
) {}

