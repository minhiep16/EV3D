package com.evshare.dispute.dto;

import com.evshare.dispute.entity.InvestigationConclusion;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class RecordInvestigationRequest {

    @NotNull(message = "Kết luận điều tra không được để trống")
    @JsonProperty("investigationConclusion")
    @JsonAlias({"conclusion", "conclusionType", "finding", "result"})
    private InvestigationConclusion investigationConclusion;

    @JsonProperty("investigationNotes")
    @JsonAlias({"notes", "explanation", "details", "note"})
    private String investigationNotes;

    public RecordInvestigationRequest() {
    }

    public RecordInvestigationRequest(InvestigationConclusion investigationConclusion, String investigationNotes) {
        this.investigationConclusion = investigationConclusion;
        this.investigationNotes = investigationNotes;
    }

    public InvestigationConclusion getInvestigationConclusion() {
        return investigationConclusion;
    }

    public void setInvestigationConclusion(InvestigationConclusion investigationConclusion) {
        this.investigationConclusion = investigationConclusion;
    }

    public InvestigationConclusion getConclusion() {
        return investigationConclusion;
    }

    public void setConclusion(InvestigationConclusion conclusion) {
        if (this.investigationConclusion == null) {
            this.investigationConclusion = conclusion;
        }
    }

    public InvestigationConclusion getEffectiveConclusion() {
        return investigationConclusion;
    }

    public String getInvestigationNotes() {
        return investigationNotes != null ? investigationNotes : "";
    }

    public void setInvestigationNotes(String investigationNotes) {
        this.investigationNotes = investigationNotes;
    }

    public void setNotes(String notes) {
        if (this.investigationNotes == null || this.investigationNotes.isBlank()) {
            this.investigationNotes = notes;
        }
    }

    public String getEffectiveNotes() {
        return getInvestigationNotes();
    }
}
