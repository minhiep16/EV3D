package com.evshare.trip.dto;

import java.math.BigDecimal;

public class CompleteTripRequest {

    private BigDecimal endOdometer;

    public CompleteTripRequest() {
    }

    public CompleteTripRequest(BigDecimal endOdometer) {
        this.endOdometer = endOdometer;
    }

    public BigDecimal getEndOdometer() {
        return endOdometer;
    }

    public void setEndOdometer(BigDecimal endOdometer) {
        this.endOdometer = endOdometer;
    }
}
