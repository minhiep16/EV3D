package com.evshare.maintenance.dto;

import com.evshare.maintenance.entity.VoteDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CastMaintenanceVoteRequest {

    @NotNull(message = "Quyết định biểu quyết không được để trống (APPROVE hoặc REJECT)")
    private VoteDecision decision;

    @Size(max = 1000, message = "Ý kiến biểu quyết không được vượt quá 1000 ký tự")
    private String comment;

    public CastMaintenanceVoteRequest() {
    }

    public CastMaintenanceVoteRequest(VoteDecision decision, String comment) {
        this.decision = decision;
        this.comment = comment;
    }

    public VoteDecision getDecision() {
        return decision;
    }

    public void setDecision(VoteDecision decision) {
        this.decision = decision;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
