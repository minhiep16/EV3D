package com.evshare.damage.controller;

import com.evshare.common.exception.GlobalExceptionHandler;
import com.evshare.damage.dto.CreateDamageRequest;
import com.evshare.damage.dto.DamageRecordResponse;
import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageType;
import com.evshare.damage.service.DamageService;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DamageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DamageService damageService;

    @InjectMocks
    private DamageController damageController;

    private ObjectMapper objectMapper = new ObjectMapper();

    private User staffUser;
    private UserPrincipal staffPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(damageController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        staffUser = new User(
                UUID.randomUUID(),
                "staff@evshare.com",
                "hash",
                "Nguyen Van Staff",
                Role.STAFF,
                UserStatus.ACTIVE
        );
        staffPrincipal = new UserPrincipal(staffUser);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(staffPrincipal, null, staffPrincipal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/damages as STAFF returns 201 Created and DamageRecordResponse")
    void testRecordTripDamage_Success() throws Exception {
        UUID tripId = UUID.randomUUID();
        UUID damageId = UUID.randomUUID();

        CreateDamageRequest request = new CreateDamageRequest(
                "BODY",
                DamageType.SCRATCH,
                DamageSeverity.MINOR,
                "Tray xam nhe",
                new BigDecimal("-0.8000"),
                new BigDecimal("0.7000"),
                new BigDecimal("0.4000")
        );

        DamageRecordResponse mockResponse = new DamageRecordResponse();
        mockResponse.setId(damageId);
        mockResponse.setTripId(tripId);
        mockResponse.setVehiclePartCode("BODY");
        mockResponse.setDamageType(DamageType.SCRATCH);
        mockResponse.setSeverity(DamageSeverity.MINOR);
        mockResponse.setNote("Tray xam nhe");
        mockResponse.setLocalPositionX(new BigDecimal("-0.8000"));
        mockResponse.setLocalPositionY(new BigDecimal("0.7000"));
        mockResponse.setLocalPositionZ(new BigDecimal("0.4000"));
        mockResponse.setCreatedByUserId(staffPrincipal.getId());
        mockResponse.setCreatedAt(Instant.now());

        when(damageService.createDamage(eq(tripId), any(CreateDamageRequest.class), eq(staffPrincipal.getId()), eq(Role.STAFF)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/trips/{tripId}/damages", tripId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(damageId.toString()))
                .andExpect(jsonPath("$.vehiclePartCode").value("BODY"))
                .andExpect(jsonPath("$.damageType").value("SCRATCH"))
                .andExpect(jsonPath("$.severity").value("MINOR"))
                .andExpect(jsonPath("$.localPositionX").value(-0.8000));
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/damages returns 403 when not STAFF")
    void testRecordTripDamage_Forbidden_Returns403() throws Exception {
        UUID tripId = UUID.randomUUID();

        CreateDamageRequest request = new CreateDamageRequest(
                "BODY", DamageType.SCRATCH, DamageSeverity.MINOR, "Tray",
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        when(damageService.createDamage(eq(tripId), any(CreateDamageRequest.class), eq(staffPrincipal.getId()), eq(Role.STAFF)))
                .thenThrow(new AccessDeniedException("Chỉ nhân viên vận hành (STAFF) mới có quyền ghi nhận hư hỏng"));

        mockMvc.perform(post("/api/trips/{tripId}/damages", tripId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Chỉ nhân viên vận hành (STAFF) mới có quyền ghi nhận hư hỏng"));
    }

    @Test
    @DisplayName("GET /api/trips/{tripId}/damages returns 200 OK and list of damages")
    void testGetDamagesByTrip_Returns200() throws Exception {
        UUID tripId = UUID.randomUUID();

        DamageRecordResponse mockDamage = new DamageRecordResponse();
        mockDamage.setId(UUID.randomUUID());
        mockDamage.setTripId(tripId);
        mockDamage.setVehiclePartCode("HOOD");
        mockDamage.setDamageType(DamageType.DENT);
        mockDamage.setSeverity(DamageSeverity.MODERATE);

        when(damageService.getDamagesByTrip(eq(tripId), eq(staffPrincipal.getId()), eq(Role.STAFF)))
                .thenReturn(List.of(mockDamage));

        mockMvc.perform(get("/api/trips/{tripId}/damages", tripId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].vehiclePartCode").value("HOOD"))
                .andExpect(jsonPath("$[0].damageType").value("DENT"));
    }
}
