package com.evshare.dispute.dto;

import com.evshare.dispute.entity.PayerType;
import com.evshare.dispute.entity.ResolutionType;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProposeResolutionRequest(
        @NotBlank(message = "Phương án hòa giải không được để trống")
        @JsonProperty("proposedResolution")
        @JsonAlias({"resolution", "proposalText", "proposeText"})
        String proposedResolution,

        @JsonProperty("resolutionType")
        @JsonAlias({"type"})
        ResolutionType resolutionType,

        @JsonProperty("proposedAmount")
        @JsonAlias({"amount", "compensationAmount"})
        BigDecimal proposedAmount,

        @JsonProperty("proposedPayerType")
        @JsonAlias({"payerType"})
        PayerType proposedPayerType,

        @JsonProperty("proposedPayerUserId")
        @JsonAlias({"payerUserId"})
        UUID proposedPayerUserId,

        @JsonProperty("proposedPayerName")
        @JsonAlias({"payerName"})
        String proposedPayerName,

        @JsonProperty("proposedRecipientUserId")
        @JsonAlias({"recipientUserId"})
        UUID proposedRecipientUserId,

        @JsonProperty("proposedRecipientName")
        @JsonAlias({"recipientName"})
        String proposedRecipientName,

        @JsonProperty("decisionBasis")
        @JsonAlias({"basis", "legalBasis"})
        String decisionBasis,

        @JsonProperty("resolutionDeadline")
        @JsonAlias({"deadline"})
        Instant resolutionDeadline
) {}
