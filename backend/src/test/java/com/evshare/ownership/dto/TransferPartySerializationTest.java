package com.evshare.ownership.dto;

import com.evshare.ownership.controller.OwnershipTransferController;
import com.evshare.ownership.service.MembershipWithdrawalService;
import com.evshare.ownership.service.OwnershipTransferService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransferPartySerializationTest {

    private ObjectMapper objectMapper;

    @Mock
    private OwnershipTransferService transferService;

    @Mock
    private MembershipWithdrawalService withdrawalService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        OwnershipTransferController controller = new OwnershipTransferController(transferService, withdrawalService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("Verify TransferPartyDto serializes 'consented':true and never 'isConsented'")
    void testTransferPartyDtoSerialization_TrueConsent() throws Exception {
        TransferPartyDto party = new TransferPartyDto(
                UUID.randomUUID(),
                "Nguyen Van A",
                "a@evshare.com",
                "TRANSFEROR",
                "Người chuyển",
                BigDecimal.valueOf(50.0),
                BigDecimal.valueOf(30.0),
                true,
                Instant.now(),
                "Đã xác nhận"
        );

        String json = objectMapper.writeValueAsString(party);

        assertNotNull(json);
        assertTrue(json.contains("\"consented\":true"), "JSON must contain 'consented':true");
        assertFalse(json.contains("\"isConsented\""), "JSON must NOT contain 'isConsented'");
        assertFalse(json.contains("\"consented\":false"), "JSON must NOT contain 'consented':false");
    }

    @Test
    @DisplayName("Verify TransferPartyDto serializes 'consented':false and preserves false value")
    void testTransferPartyDtoSerialization_FalseConsent() throws Exception {
        TransferPartyDto party = new TransferPartyDto(
                UUID.randomUUID(),
                "Tran Thi B",
                "b@evshare.com",
                "RECIPIENT",
                "Người nhận",
                BigDecimal.valueOf(25.0),
                BigDecimal.valueOf(45.0),
                false,
                null,
                "Chờ xác nhận"
        );

        String json = objectMapper.writeValueAsString(party);

        assertNotNull(json);
        assertTrue(json.contains("\"consented\":false"), "JSON must contain 'consented':false");
        assertFalse(json.contains("\"isConsented\""), "JSON must NOT contain 'isConsented'");
        assertFalse(json.contains("\"consented\":true"), "JSON must NOT contain 'consented':true");
    }

    @Test
    @DisplayName("Verify TransferPartyDto deserialization accepts both canonical and alias names")
    void testTransferPartyDtoDeserialization() throws Exception {
        String canonicalJson = "{\"consented\":true,\"fullName\":\"Nguyen Van A\"}";
        TransferPartyDto canonicalDto = objectMapper.readValue(canonicalJson, TransferPartyDto.class);
        assertTrue(canonicalDto.isConsented(), "Canonical 'consented':true must be deserialized");

        String aliasJson = "{\"isConsented\":true,\"fullName\":\"Nguyen Van A\"}";
        TransferPartyDto aliasDto = objectMapper.readValue(aliasJson, TransferPartyDto.class);
        assertTrue(aliasDto.isConsented(), "Alias 'isConsented':true must be deserialized");
    }

    @Test
    @DisplayName("Verify List<OwnershipTransferResponse> serializes without JsonMappingException")
    void testOwnershipTransferResponseListSerialization() {
        UUID transferId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID vehicleId = UUID.randomUUID();
        UUID fromUserId = UUID.randomUUID();
        UUID toUserId = UUID.randomUUID();

        OwnershipTransferResponse resp = new OwnershipTransferResponse();
        resp.setId(transferId);
        resp.setGroupId(groupId);
        resp.setGroupName("EV01 Co-ownership Group");
        resp.setVehicleId(vehicleId);
        resp.setVehicleName("VinFast VF8");
        resp.setVehicleCode("EV01");
        resp.setFromUserId(fromUserId);
        resp.setFromUserName("Nguyen Van A");
        resp.setFromUserEmail("a@evshare.com");
        resp.setToUserId(toUserId);
        resp.setToUserName("Tran Thi B");
        resp.setToUserEmail("b@evshare.com");
        resp.setTransferPercentage(BigDecimal.valueOf(20.0));
        resp.setStatus("PENDING_ACCEPTANCE");
        resp.setStatusVi("Chờ hai bên xác nhận");

        List<TransferPartyDto> parties = new ArrayList<>();
        parties.add(new TransferPartyDto(
                fromUserId,
                "Nguyen Van A",
                "a@evshare.com",
                "TRANSFEROR",
                "Người chuyển",
                BigDecimal.valueOf(50.0),
                BigDecimal.valueOf(30.0),
                true,
                Instant.now(),
                "Đã xác nhận"
        ));
        parties.add(new TransferPartyDto(
                toUserId,
                "Tran Thi B",
                "b@evshare.com",
                "RECIPIENT",
                "Người nhận",
                BigDecimal.valueOf(25.0),
                BigDecimal.valueOf(45.0),
                false,
                null,
                "Chờ xác nhận"
        ));
        resp.setParties(parties);

        List<OwnershipTransferResponse> responseList = List.of(resp);

        assertDoesNotThrow(() -> {
            String json = objectMapper.writeValueAsString(responseList);
            assertNotNull(json);
            assertTrue(json.contains("\"consented\":true"));
            assertTrue(json.contains("\"consented\":false"));
            assertFalse(json.contains("\"isConsented\""));
        }, "Serializing List<OwnershipTransferResponse> must never throw HttpMessageNotWritableException or JsonMappingException");
    }

    @Test
    @DisplayName("Verify actual Spring HTTP response path for transfer list endpoint")
    void testSpringHttpResponsePath() throws Exception {
        UUID groupId = UUID.randomUUID();
        UUID fromUserId = UUID.randomUUID();
        UUID toUserId = UUID.randomUUID();

        OwnershipTransferResponse resp = new OwnershipTransferResponse();
        resp.setId(UUID.randomUUID());
        resp.setGroupId(groupId);
        resp.setFromUserId(fromUserId);
        resp.setFromUserName("Nguyen Van A");
        resp.setToUserId(toUserId);
        resp.setToUserName("Tran Thi B");
        resp.setStatus("PENDING_ACCEPTANCE");

        List<TransferPartyDto> parties = new ArrayList<>();
        parties.add(new TransferPartyDto(
                fromUserId, "Nguyen Van A", "a@evshare.com", "TRANSFEROR", "Người chuyển",
                BigDecimal.valueOf(50.0), BigDecimal.valueOf(30.0), true, Instant.now(), "Đã xác nhận"
        ));
        parties.add(new TransferPartyDto(
                toUserId, "Tran Thi B", "b@evshare.com", "RECIPIENT", "Người nhận",
                BigDecimal.valueOf(25.0), BigDecimal.valueOf(45.0), false, null, "Chờ xác nhận"
        ));
        resp.setParties(parties);

        when(transferService.getTransferRequestsByGroup(eq(groupId), any())).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/groups/" + groupId + "/transfers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parties[0].consented").value(true))
                .andExpect(jsonPath("$[0].parties[0].isConsented").doesNotExist())
                .andExpect(jsonPath("$[0].parties[1].consented").value(false))
                .andExpect(jsonPath("$[0].parties[1].isConsented").doesNotExist());
    }
}
