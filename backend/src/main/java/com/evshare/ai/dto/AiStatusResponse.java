package com.evshare.ai.dto;

public class AiStatusResponse {

    private boolean llmConfigured;
    private boolean groundedDataAvailable;
    private String provider;
    private String model;
    private String statusMessage;

    public AiStatusResponse() {
    }

    public AiStatusResponse(boolean llmConfigured, boolean groundedDataAvailable, String provider, String model, String statusMessage) {
        this.llmConfigured = llmConfigured;
        this.groundedDataAvailable = groundedDataAvailable;
        this.provider = provider;
        this.model = model;
        this.statusMessage = statusMessage;
    }

    public boolean isLlmConfigured() {
        return llmConfigured;
    }

    public void setLlmConfigured(boolean llmConfigured) {
        this.llmConfigured = llmConfigured;
    }

    public boolean isGroundedDataAvailable() {
        return groundedDataAvailable;
    }

    public void setGroundedDataAvailable(boolean groundedDataAvailable) {
        this.groundedDataAvailable = groundedDataAvailable;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}

