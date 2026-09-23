package com.evshare.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthResponse {
    private String status;
    private String api;
    private String database;
    private Instant timestamp;
    private String message;

    public HealthResponse() {
    }

    public HealthResponse(String status, String api, String database, Instant timestamp, String message) {
        this.status = status;
        this.api = api;
        this.database = database;
        this.timestamp = timestamp;
        this.message = message;
    }

    public static HealthResponse up(String message) {
        return new HealthResponse("UP", "UP", "UP", Instant.now(), message);
    }

    public static HealthResponse down(String message) {
        return new HealthResponse("DOWN", "UP", "DOWN", Instant.now(), message);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApi() {
        return api;
    }

    public void setApi(String api) {
        this.api = api;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
