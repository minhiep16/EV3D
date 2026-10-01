package com.evshare.charging.service;

import com.evshare.battery.entity.VehicleBatteryHealth;
import com.evshare.battery.repository.VehicleBatteryHealthRepository;
import com.evshare.charging.dto.ChargingSessionResponse;
import com.evshare.charging.dto.ChargingStationResponse;
import com.evshare.charging.dto.CreateChargingSessionRequest;
import com.evshare.charging.dto.ProgressChargingSessionRequest;
import com.evshare.charging.entity.ChargingConnectorType;
import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.entity.ChargingSessionStatus;
import com.evshare.charging.entity.ChargingStation;
import com.evshare.charging.entity.ChargingStationStatus;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.charging.repository.ChargingStationRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.vehicle.service.VehicleService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChargingService {

    private final ChargingStationRepository chargingStationRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;
    private final TripRepository tripRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final VehicleBatteryHealthRepository batteryHealthRepository;
    private final ChargingProgressService chargingProgressService;

    public ChargingService(
            ChargingStationRepository chargingStationRepository,
            ChargingSessionRepository chargingSessionRepository,
            VehicleRepository vehicleRepository,
            VehicleService vehicleService,
            TripRepository tripRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            VehicleBatteryHealthRepository batteryHealthRepository,
            ChargingProgressService chargingProgressService
    ) {
        this.chargingStationRepository = chargingStationRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleService = vehicleService;
        this.tripRepository = tripRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.batteryHealthRepository = batteryHealthRepository;
        this.chargingProgressService = chargingProgressService;
    }

    @Transactional(readOnly = true)
    public List<ChargingStationResponse> getChargingStations() {
        return chargingStationRepository.findAll().stream()
                .map(ChargingStationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChargingStationResponse getChargingStationById(UUID stationId) {
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Trụ sạc không tồn tại với ID: " + stationId));
        return ChargingStationResponse.fromEntity(station);
    }

    @Transactional
    public ChargingSessionResponse getActiveSessionForVehicle(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);
        Optional<ChargingSession> sessionOpt = chargingSessionRepository
                .findFirstByVehicleIdAndStatusOrderByStartedAtDesc(vehicleId, ChargingSessionStatus.ACTIVE);

        if (sessionOpt.isEmpty()) {
            return null;
        }

        ChargingSession session = sessionOpt.get();
        // Deterministic server-side progression recomputation on read
        ChargingSession syncedSession = chargingProgressService.syncSession(session, Instant.now());
        Integer eta = chargingProgressService.calculateRemainingMinutes(syncedSession);

        return ChargingSessionResponse.fromEntity(syncedSession, eta);
    }

    @Transactional
    public List<ChargingSessionResponse> getSessionHistoryForVehicle(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);
        // Ensure any active session is progressed before reading history
        chargingProgressService.syncActiveSessionForVehicle(vehicleId);
        return chargingSessionRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId).stream()
                .map(session -> {
                    Integer eta = session.getStatus() == ChargingSessionStatus.ACTIVE
                            ? chargingProgressService.calculateRemainingMinutes(session)
                            : 0;
                    return ChargingSessionResponse.fromEntity(session, eta);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ChargingSessionResponse createChargingSession(
            UUID vehicleId,
            CreateChargingSessionRequest request,
            UserPrincipal principal
    ) {
        validateVehicleAccess(vehicleId, principal);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Phương tiện không tồn tại với ID: " + vehicleId));

        // 1. Business Rule: Vehicle under MAINTENANCE cannot start charging
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE ||
                maintenanceRequestRepository.existsByVehicleIdAndStatus(vehicleId, MaintenanceStatus.IN_PROGRESS)) {
            throw new IllegalStateException("Xe đang được bảo dưỡng nên chưa thể sạc.");
        }

        // 2. Business Rule: Vehicle IN_USE cannot start charging
        if (vehicle.getStatus() == VehicleStatus.IN_USE ||
                tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)) {
            throw new IllegalStateException("Xe đang được sử dụng trong chuyến đi nên chưa thể sạc.");
        }

        // 3. Business Rule: Vehicle already has an ACTIVE charging session
        if (chargingSessionRepository.existsByVehicleIdAndStatus(vehicleId, ChargingSessionStatus.ACTIVE)) {
            throw new IllegalStateException("Xe đã có một phiên sạc đang hoạt động.");
        }

        // 4. Check Charging Station availability
        ChargingStation station = chargingStationRepository.findById(request.getChargingStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Trụ sạc không tồn tại với ID: " + request.getChargingStationId()));

        if (station.getStatus() == ChargingStationStatus.OUT_OF_SERVICE) {
            throw new IllegalStateException("Trụ sạc này hiện đang tạm ngưng phục vụ.");
        }

        if (station.getStatus() == ChargingStationStatus.OCCUPIED ||
                chargingSessionRepository.existsByChargingStationIdAndStatus(station.getId(), ChargingSessionStatus.ACTIVE)) {
            throw new IllegalStateException("Trụ sạc này hiện đang được sử dụng.");
        }

        // 5. Target SOC Validation
        BigDecimal currentSoc = vehicle.getCurrentBatteryLevel() != null
                ? BigDecimal.valueOf(vehicle.getCurrentBatteryLevel())
                : BigDecimal.ZERO;

        if (request.getTargetSocPercent().compareTo(currentSoc) <= 0) {
            throw new IllegalArgumentException(
                    "Mức pin mục tiêu (" + request.getTargetSocPercent() + "%) phải lớn hơn mức pin hiện tại (" + currentSoc + "%)."
            );
        }

        if (request.getTargetSocPercent().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Mức pin mục tiêu không thể vượt quá 100%.");
        }

        User user = principal.getUser();
        boolean startNow = Boolean.TRUE.equals(request.getStartImmediately());
        ChargingSessionStatus initialStatus = startNow ? ChargingSessionStatus.ACTIVE : ChargingSessionStatus.PENDING;
        Instant now = Instant.now();

        ChargingSession session = new ChargingSession(
                UUID.randomUUID(),
                vehicle,
                station,
                initialStatus,
                user,
                startNow ? now : null,
                currentSoc,
                currentSoc,
                request.getTargetSocPercent(),
                station.getMaxPowerKw()
        );

        if (startNow) {
            station.setStatus(ChargingStationStatus.OCCUPIED);
            vehicle.setStatus(VehicleStatus.CHARGING);
            chargingStationRepository.save(station);
            vehicleRepository.save(vehicle);
        }

        ChargingSession savedSession = chargingSessionRepository.save(session);
        Integer eta = savedSession.getStatus() == ChargingSessionStatus.ACTIVE
                ? chargingProgressService.calculateRemainingMinutes(savedSession)
                : 0;
        return ChargingSessionResponse.fromEntity(savedSession, eta);
    }

    @Transactional
    public ChargingSessionResponse startChargingSession(UUID sessionId, UserPrincipal principal) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên sạc không tồn tại với ID: " + sessionId));

        validateSessionAccess(session, principal);

        if (session.getStatus() != ChargingSessionStatus.PENDING) {
            throw new IllegalStateException("Chỉ phiên sạc ở trạng thái chờ (PENDING) mới có thể bắt đầu.");
        }

        Vehicle vehicle = session.getVehicle();
        ChargingStation station = session.getChargingStation();

        // Concurrency guard: re-verify station and vehicle availability
        if (chargingSessionRepository.existsByChargingStationIdAndStatus(station.getId(), ChargingSessionStatus.ACTIVE)) {
            throw new IllegalStateException("Trụ sạc này hiện đang được sử dụng.");
        }
        if (chargingSessionRepository.existsByVehicleIdAndStatus(vehicle.getId(), ChargingSessionStatus.ACTIVE)) {
            throw new IllegalStateException("Xe đã có một phiên sạc đang hoạt động.");
        }
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE || vehicle.getStatus() == VehicleStatus.IN_USE) {
            throw new IllegalStateException("Trạng thái xe không sẵn sàng để bắt đầu sạc.");
        }

        session.setStatus(ChargingSessionStatus.ACTIVE);
        session.setStartedAt(Instant.now());
        station.setStatus(ChargingStationStatus.OCCUPIED);
        vehicle.setStatus(VehicleStatus.CHARGING);

        chargingStationRepository.save(station);
        vehicleRepository.save(vehicle);
        ChargingSession saved = chargingSessionRepository.save(session);
        Integer eta = chargingProgressService.calculateRemainingMinutes(saved);

        return ChargingSessionResponse.fromEntity(saved, eta);
    }

    @Transactional
    public ChargingSessionResponse progressChargingSession(
            UUID sessionId,
            ProgressChargingSessionRequest request,
            UserPrincipal principal
    ) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên sạc không tồn tại với ID: " + sessionId));

        validateSessionAccess(session, principal);

        if (session.getStatus() != ChargingSessionStatus.ACTIVE) {
            throw new IllegalStateException("Phiên sạc không ở trạng thái hoạt động (ACTIVE).");
        }

        // Support manual +5% simulation as a DEV-only helper if newSocPercent is explicitly provided
        if (request != null && request.getNewSocPercent() != null) {
            BigDecimal newSoc = request.getNewSocPercent();
            if (newSoc.compareTo(BigDecimal.valueOf(100)) > 0) {
                newSoc = BigDecimal.valueOf(100);
            }
            if (newSoc.compareTo(session.getCurrentSocPercent()) < 0) {
                newSoc = session.getCurrentSocPercent();
            }

            session.setCurrentSocPercent(newSoc);

            Vehicle vehicle = session.getVehicle();
            if (vehicle != null) {
                vehicle.setCurrentBatteryLevel(newSoc.intValue());
                vehicleRepository.save(vehicle);
                chargingProgressService.updateBatteryHealthEstimate(vehicle, newSoc);
            }

            BigDecimal usableCapacity = chargingProgressService.resolveUsableCapacity(vehicle);
            BigDecimal deltaSoc = newSoc.subtract(session.getStartSocPercent()).max(BigDecimal.ZERO);
            BigDecimal delivered = deltaSoc.multiply(usableCapacity)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            session.setEnergyDeliveredKwh(delivered);

            if (newSoc.compareTo(session.getTargetSocPercent()) >= 0) {
                return completeChargingSessionInternal(session, "Đạt mức pin mục tiêu " + session.getTargetSocPercent() + "%");
            }

            ChargingSession saved = chargingSessionRepository.save(session);
            Integer eta = chargingProgressService.calculateRemainingMinutes(saved);
            return ChargingSessionResponse.fromEntity(saved, eta);
        }

        // Default: authoritative server elapsed-time sync
        ChargingSession synced = chargingProgressService.syncSession(session, Instant.now());
        Integer eta = chargingProgressService.calculateRemainingMinutes(synced);
        return ChargingSessionResponse.fromEntity(synced, eta);
    }

    @Transactional
    public ChargingSessionResponse completeChargingSession(UUID sessionId, UserPrincipal principal) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên sạc không tồn tại với ID: " + sessionId));

        validateSessionAccess(session, principal);

        if (session.getStatus() != ChargingSessionStatus.ACTIVE && session.getStatus() != ChargingSessionStatus.PENDING) {
            throw new IllegalStateException("Phiên sạc đã kết thúc.");
        }

        // If ACTIVE, ensure session is synced to current server time before final completion
        if (session.getStatus() == ChargingSessionStatus.ACTIVE) {
            session = chargingProgressService.syncSession(session, Instant.now());
            if (session.getStatus() == ChargingSessionStatus.COMPLETED) {
                return ChargingSessionResponse.fromEntity(session, 0);
            }
        }

        return completeChargingSessionInternal(session, "Người dùng hoàn tất phiên sạc");
    }

    @Transactional
    public ChargingSessionResponse cancelChargingSession(UUID sessionId, UserPrincipal principal) {
        ChargingSession session = chargingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên sạc không tồn tại với ID: " + sessionId));

        validateSessionAccess(session, principal);

        if (session.getStatus() != ChargingSessionStatus.PENDING && session.getStatus() != ChargingSessionStatus.ACTIVE) {
            throw new IllegalStateException("Phiên sạc đã kết thúc.");
        }

        session.setStatus(ChargingSessionStatus.CANCELLED);
        session.setEndedAt(Instant.now());
        session.setCompletionReason("Người dùng hủy phiên sạc");

        // Free charging station
        ChargingStation station = session.getChargingStation();
        if (station != null) {
            station.setStatus(ChargingStationStatus.AVAILABLE);
            chargingStationRepository.save(station);
        }

        // Recalculate vehicle status authoritatively
        Vehicle vehicle = session.getVehicle();
        if (vehicle != null) {
            chargingProgressService.recalculateVehicleStatus(vehicle);
        }

        ChargingSession saved = chargingSessionRepository.save(session);
        return ChargingSessionResponse.fromEntity(saved, 0);
    }

    private ChargingSessionResponse completeChargingSessionInternal(ChargingSession session, String reason) {
        session.setStatus(ChargingSessionStatus.COMPLETED);
        if (session.getEndedAt() == null) {
            session.setEndedAt(Instant.now());
        }
        session.setCompletionReason(reason);

        // Ensure final vehicle battery level matches session currentSoc
        Vehicle vehicle = session.getVehicle();
        if (vehicle != null) {
            vehicle.setCurrentBatteryLevel(session.getCurrentSocPercent().intValue());
            chargingProgressService.recalculateVehicleStatus(vehicle);
            chargingProgressService.updateBatteryHealthEstimate(vehicle, session.getCurrentSocPercent());
        }

        // Free charging station
        ChargingStation station = session.getChargingStation();
        if (station != null) {
            station.setStatus(ChargingStationStatus.AVAILABLE);
            chargingStationRepository.save(station);
        }

        ChargingSession saved = chargingSessionRepository.save(session);
        return ChargingSessionResponse.fromEntity(saved, 0);
    }

    private void validateVehicleAccess(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện thao tác.");
        }
        Role role = principal.getUser().getRole();
        if (role == Role.CO_OWNER) {
            // Strict Authorization: CO_OWNER can only access their authorized co-owned vehicle
            vehicleService.getVehicleById(vehicleId, principal);
        } else if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền truy cập thông tin sạc của xe này.");
        }
    }

    private void validateSessionAccess(ChargingSession session, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện thao tác.");
        }
        Role role = principal.getUser().getRole();
        if (role == Role.CO_OWNER) {
            UUID vehicleId = session.getVehicle().getId();
            vehicleService.getVehicleById(vehicleId, principal);
        } else if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền quản lý phiên sạc này.");
        }
    }
}
