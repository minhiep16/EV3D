package com.evshare.ai.controller;

import com.evshare.ai.dto.AiChatRequest;
import com.evshare.ai.dto.AiChatResponse;
import com.evshare.ai.dto.AiStatusResponse;
import com.evshare.ai.dto.AiSuggestedQuestionDto;
import com.evshare.ai.service.AiAssistantService;
import com.evshare.ai.service.AiBusinessDataService;
import com.evshare.security.UserPrincipal;
import com.evshare.vehicle.entity.Vehicle;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    private final AiAssistantService assistantService;
    private final AiBusinessDataService businessDataService;

    public AiAssistantController(AiAssistantService assistantService, AiBusinessDataService businessDataService) {
        this.assistantService = assistantService;
        this.businessDataService = businessDataService;
    }

    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> getStatus() {
        return ResponseEntity.ok(assistantService.getStatus());
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<AiSuggestedQuestionDto>> getSuggestions(
            @RequestParam(value = "vehicleId", required = false) String vehicleId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(assistantService.getSuggestions(vehicleId, currentUser));
    }

    @GetMapping("/context")
    public ResponseEntity<Map<String, Object>> getContext(
            @RequestParam(value = "vehicleId", required = false) String vehicleId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        Optional<Vehicle> vehicle = businessDataService.resolveVehicle(vehicleId);
        return ResponseEntity.ok(businessDataService.collectGroundedContext(vehicle.orElse(null), currentUser));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        AiChatResponse response = assistantService.processMessage(request, currentUser);
        return ResponseEntity.ok(response);
    }
}

