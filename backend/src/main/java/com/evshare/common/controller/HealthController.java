package com.evshare.common.controller;

import com.evshare.common.dto.HealthResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> checkHealth() {
        boolean dbHealthy = false;
        String errorMessage = null;

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                try (Statement stmt = connection.createStatement()) {
                    stmt.execute("SELECT 1");
                    dbHealthy = true;
                }
            }
        } catch (Exception e) {
            log.warn("Database health probe failed: {}", e.getMessage());
            errorMessage = e.getMessage();
        }

        if (dbHealthy) {
            return ResponseEntity.ok(HealthResponse.up("All systems operational"));
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(HealthResponse.down(errorMessage != null ? errorMessage : "Database connectivity error"));
        }
    }
}
