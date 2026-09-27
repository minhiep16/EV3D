package com.evshare.trip.controller;

import com.evshare.common.exception.GlobalExceptionHandler;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.service.TripService;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TripControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TripService tripService;

    @InjectMocks
    private TripController tripController;

    private User coOwnerUser;
    private UserPrincipal coOwnerPrincipal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tripController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        coOwnerUser = new User(
                UUID.randomUUID(),
                "coowner@evshare.com",
                "hash",
                "Nguyen Van A",
                Role.CO_OWNER,
                UserStatus.ACTIVE
        );
        coOwnerPrincipal = new UserPrincipal(coOwnerUser);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(coOwnerPrincipal, null, coOwnerPrincipal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/complete returns 200 OK and completed TripResponse")
    void testCompleteTrip_Success() throws Exception {
        UUID tripId = UUID.randomUUID();

        TripResponse mockResponse = new TripResponse();
        mockResponse.setId(tripId);
        mockResponse.setStatus(TripStatus.COMPLETED);
        mockResponse.setEndedAt(Instant.now());
        mockResponse.setEndBatteryLevel(75);
        mockResponse.setEndOdometer(new BigDecimal("10620.00"));
        mockResponse.setDurationSeconds(3600L);
        mockResponse.setDistanceTraveled(new BigDecimal("69.50"));
        mockResponse.setBatteryUsed(13);

        when(tripService.completeTrip(eq(tripId), eq(coOwnerPrincipal.getId()), eq(Role.CO_OWNER)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/trips/{tripId}/complete", tripId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tripId.toString()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.endBatteryLevel").value(75))
                .andExpect(jsonPath("$.endOdometer").value(10620.00))
                .andExpect(jsonPath("$.batteryUsed").value(13))
                .andExpect(jsonPath("$.distanceTraveled").value(69.50))
                .andExpect(jsonPath("$.durationSeconds").value(3600))
                .andExpect(jsonPath("$.endedAt").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/complete returns 403 Forbidden when not trip owner")
    void testCompleteTrip_Forbidden_Returns403() throws Exception {
        UUID tripId = UUID.randomUUID();

        when(tripService.completeTrip(eq(tripId), eq(coOwnerPrincipal.getId()), eq(Role.CO_OWNER)))
                .thenThrow(new AccessDeniedException("BẠN KHÔNG CÓ QUYỀN KẾT THÚC CHUYẾN ĐI NÀY"));

        mockMvc.perform(post("/api/trips/{tripId}/complete", tripId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("BẠN KHÔNG CÓ QUYỀN KẾT THÚC CHUYẾN ĐI NÀY"));
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/complete returns 404 Not Found when trip does not exist")
    void testCompleteTrip_NotFound_Returns404() throws Exception {
        UUID tripId = UUID.randomUUID();

        when(tripService.completeTrip(eq(tripId), eq(coOwnerPrincipal.getId()), eq(Role.CO_OWNER)))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        mockMvc.perform(post("/api/trips/{tripId}/complete", tripId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/complete returns 409 Conflict when trip already completed")
    void testCompleteTrip_AlreadyCompleted_Returns409() throws Exception {
        UUID tripId = UUID.randomUUID();

        when(tripService.completeTrip(eq(tripId), eq(coOwnerPrincipal.getId()), eq(Role.CO_OWNER)))
                .thenThrow(new IllegalStateException("CHUYẾN ĐI ĐÃ ĐƯỢC KẾT THÚC"));

        mockMvc.perform(post("/api/trips/{tripId}/complete", tripId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("CHUYẾN ĐI ĐÃ ĐƯỢC KẾT THÚC"));
    }

    @Test
    @DisplayName("POST /api/trips/{tripId}/complete without authentication principal returns 401")
    void testCompleteTrip_Unauthenticated_Returns401() throws Exception {
        SecurityContextHolder.clearContext();
        UUID tripId = UUID.randomUUID();

        mockMvc.perform(post("/api/trips/{tripId}/complete", tripId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
