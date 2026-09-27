package com.evshare.booking.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class BookingResponseTest {

    @Test
    void testSerialization() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        BookingResponse response = new BookingResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Nguyen Van A",
                "owner_a@evshare.com",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                null,
                "Test",
                Instant.now(),
                true
        );

        String json = mapper.writeValueAsString(response);
        assertNotNull(json);
        assertTrue(json.contains("\"isExpired\":true"));
        assertTrue(json.contains("\"expired\":true"));
    }
}
