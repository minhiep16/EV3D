package com.evshare.dispute.dto;

import com.evshare.dispute.entity.InvestigationConclusion;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecordInvestigationRequestSerializationTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("TC01: Valid investigation conclusion JSON with 'conclusion' and 'investigationConclusion'")
    void testValidDeserializationWithBothFields() throws Exception {
        String json = """
                {
                  "conclusion": "LATE_RETURN_BY_PREVIOUS_USER",
                  "investigationConclusion": "LATE_RETURN_BY_PREVIOUS_USER",
                  "investigationNotes": "Xe bàn giao chậm 94 phút"
                }
                """;
        RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
        assertNotNull(req);
        assertEquals(InvestigationConclusion.LATE_RETURN_BY_PREVIOUS_USER, req.getEffectiveConclusion());
        assertEquals("Xe bàn giao chậm 94 phút", req.getEffectiveNotes());
    }

    @Test
    @DisplayName("TC02: Deserialization of every currently supported conclusion")
    void testSupportedConclusions() throws Exception {
        for (InvestigationConclusion expected : InvestigationConclusion.values()) {
            String json = String.format("{\"investigationConclusion\":\"%s\",\"investigationNotes\":\"test\"}", expected.name());
            RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
            assertNotNull(req);
            assertEquals(expected, req.getEffectiveConclusion());
        }
    }

    @Test
    @DisplayName("TC03: Deserialization with aliases and case-insensitive names")
    void testCaseInsensitiveAndSynonyms() throws Exception {
        String json = """
                {
                  "investigationConclusion": "late_return_by_previous_user",
                  "investigationNotes": "OK"
                }
                """;
        RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
        assertNotNull(req);
        assertEquals(InvestigationConclusion.LATE_RETURN_BY_PREVIOUS_USER, req.getEffectiveConclusion());
    }

    @Test
    @DisplayName("TC04: Unknown conclusion returns null in DTO for validation rejection")
    void testUnknownConclusion() throws Exception {
        String json = """
                {
                  "investigationConclusion": "SOME_UNKNOWN_CONCLUSION",
                  "investigationNotes": "test"
                }
                """;
        RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
        assertNotNull(req);
        assertNull(req.getEffectiveConclusion());
    }

    @Test
    @DisplayName("TC05: Payload with only 'investigationConclusion' field")
    void testOnlyInvestigationConclusion() throws Exception {
        String json = """
                {
                  "investigationConclusion": "LATE_STAFF_PROCESSING",
                  "investigationNotes": "Nhân viên chậm tiếp nhận xe"
                }
                """;
        RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
        assertNotNull(req);
        assertEquals(InvestigationConclusion.LATE_STAFF_PROCESSING, req.getEffectiveConclusion());
    }

    @Test
    @DisplayName("TC06: Payload with only 'conclusion' field")
    void testOnlyConclusionField() throws Exception {
        String json = """
                {
                  "conclusion": "OPERATIONAL_PROBLEM",
                  "investigationNotes": "Trạm sạc mất điện"
                }
                """;
        RecordInvestigationRequest req = objectMapper.readValue(json, RecordInvestigationRequest.class);
        assertNotNull(req);
        assertEquals(InvestigationConclusion.OPERATIONAL_PROBLEM, req.getEffectiveConclusion());
    }
}
