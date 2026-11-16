package com.evshare.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiProviderService {

    private static final Logger log = LoggerFactory.getLogger(AiProviderService.class);

    @Value("${app.ai.enabled:false}")
    private boolean enabled;

    @Value("${app.ai.provider:none}")
    private String provider;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model:gemini-1.5-flash}")
    private String model;

    @Value("${app.ai.endpoint:https://generativelanguage.googleapis.com/v1beta/models}")
    private String endpoint;

    private final RestTemplate restTemplate;

    public AiProviderService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(7000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfiguredAndAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank() && !"none".equalsIgnoreCase(provider);
    }

    public String getProviderName() {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return "NONE (Grounded Copilot Mode)";
        }
        return provider.toUpperCase();
    }

    public String getModelName() {
        return isConfiguredAndAvailable() ? model : "Grounded Rule Engine";
    }

    /**
     * Executes external LLM completion using configured credentials.
     * Guaranteed safe: Never leaks secrets to client; catches timeouts and network issues gracefully.
     */
    public String generateCompletion(String userPrompt, String systemContext) {
        if (!isConfiguredAndAvailable()) {
            return null;
        }

        try {
            if ("gemini".equalsIgnoreCase(provider)) {
                return callGemini(userPrompt, systemContext);
            }
            // Other provider extensions can be attached here
            return null;
        } catch (Exception e) {
            log.warn("AI Provider completion failed or timed out: {}", e.getMessage());
            return null;
        }
    }

    private String callGemini(String userPrompt, String systemContext) {
        String url = endpoint + "/" + model + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String combinedText = "Hệ thống: " + systemContext + "\n\nNgười dùng: " + userPrompt;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", combinedText);

        Map<String, Object> contentPart = new HashMap<>();
        contentPart.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(contentPart));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map body = response.getBody();
            List candidates = (List) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map firstCandidate = (Map) candidates.get(0);
                Map content = (Map) firstCandidate.get("content");
                if (content != null) {
                    List parts = (List) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map firstPart = (Map) parts.get(0);
                        return (String) firstPart.get("text");
                    }
                }
            }
        }
        return null;
    }
}

