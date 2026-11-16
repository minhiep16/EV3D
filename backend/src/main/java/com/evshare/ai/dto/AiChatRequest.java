package com.evshare.ai.dto;

import java.util.List;

public class AiChatRequest {

    private String message;
    private String vehicleId;
    private List<ChatMessageItem> history;

    public AiChatRequest() {
    }

    public AiChatRequest(String message, String vehicleId, List<ChatMessageItem> history) {
        this.message = message;
        this.vehicleId = vehicleId;
        this.history = history;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }

    public List<ChatMessageItem> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessageItem> history) {
        this.history = history;
    }

    public static class ChatMessageItem {
        private String sender;
        private String text;

        public ChatMessageItem() {
        }

        public ChatMessageItem(String sender, String text) {
            this.sender = sender;
            this.text = text;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}

