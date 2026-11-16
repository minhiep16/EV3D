package com.evshare.ai.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AiChatResponse {

    private String id;
    private String reply;
    private String role = "assistant";
    private Instant timestamp;
    private String asOf;
    private String sourceMode;
    private List<String> verifiedFacts = new ArrayList<>();
    private List<String> suggestedNextQuestions = new ArrayList<>();
    private String actionNotice;

    public AiChatResponse() {
        this.timestamp = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getAsOf() {
        return asOf;
    }

    public void setAsOf(String asOf) {
        this.asOf = asOf;
    }

    public String getSourceMode() {
        return sourceMode;
    }

    public void setSourceMode(String sourceMode) {
        this.sourceMode = sourceMode;
    }

    public List<String> getVerifiedFacts() {
        return verifiedFacts;
    }

    public void setVerifiedFacts(List<String> verifiedFacts) {
        this.verifiedFacts = verifiedFacts;
    }

    public List<String> getSuggestedNextQuestions() {
        return suggestedNextQuestions;
    }

    public void setSuggestedNextQuestions(List<String> suggestedNextQuestions) {
        this.suggestedNextQuestions = suggestedNextQuestions;
    }

    public String getActionNotice() {
        return actionNotice;
    }

    public void setActionNotice(String actionNotice) {
        this.actionNotice = actionNotice;
    }
}

