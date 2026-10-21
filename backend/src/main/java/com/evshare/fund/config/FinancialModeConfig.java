package com.evshare.fund.config;

import com.evshare.fund.entity.FinancialMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FinancialModeConfig {

    @Value("${app.financial-mode:DEMO}")
    private String financialMode;

    public FinancialMode getMode() {
        if (financialMode == null || financialMode.trim().isEmpty()) {
            return FinancialMode.DEMO;
        }
        try {
            return FinancialMode.valueOf(financialMode.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return FinancialMode.DEMO;
        }
    }

    public boolean isDemoMode() {
        return getMode() == FinancialMode.DEMO;
    }

    public String getVietnameseLabel() {
        return getMode().getVietnameseLabel();
    }
}
