package com.evshare.maintenance.dto;

import jakarta.validation.constraints.Size;

public class CompleteMaintenanceRequest {

    @Size(max = 2000, message = "Ghi chú hoàn tất không được vượt quá 2000 ký tự")
    private String completionNote;

    public CompleteMaintenanceRequest() {
    }

    public CompleteMaintenanceRequest(String completionNote) {
        this.completionNote = completionNote;
    }

    public String getCompletionNote() {
        return completionNote;
    }

    public void setCompletionNote(String completionNote) {
        this.completionNote = completionNote;
    }
}
