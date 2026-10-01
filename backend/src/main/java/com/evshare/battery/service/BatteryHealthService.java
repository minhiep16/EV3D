package com.evshare.battery.service;

import com.evshare.battery.dto.BatteryHealthResponse;
import com.evshare.battery.entity.VehicleBatteryHealth;
import com.evshare.battery.repository.VehicleBatteryHealthRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.vehicle.service.VehicleService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class BatteryHealthService {

    private final VehicleBatteryHealthRepository batteryHealthRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;
    private final com.evshare.charging.service.ChargingProgressService chargingProgressService;

    public BatteryHealthService(
            VehicleBatteryHealthRepository batteryHealthRepository,
            VehicleRepository vehicleRepository,
            VehicleService vehicleService,
            com.evshare.charging.service.ChargingProgressService chargingProgressService
    ) {
        this.batteryHealthRepository = batteryHealthRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleService = vehicleService;
        this.chargingProgressService = chargingProgressService;
    }

    @Transactional
    public BatteryHealthResponse getBatteryHealth(UUID vehicleId, UserPrincipal principal) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        if (vehicle.getStatus() == VehicleStatus.CHARGING) {
            chargingProgressService.syncActiveSessionForVehicle(vehicleId);
            vehicle = vehicleRepository.findById(vehicleId).orElse(vehicle);
        }

        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để xem thông tin pin xe.");
        }

        Role userRole = principal.getUser().getRole();
        if (userRole == Role.CO_OWNER) {
            // Strict Authorization: CO_OWNER can only view battery health for their authorized co-owned vehicle
            vehicleService.getVehicleById(vehicleId, principal);
        } else if (userRole != Role.STAFF && userRole != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu kỹ thuật của xe này.");
        }

        VehicleBatteryHealth health = batteryHealthRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có dữ liệu sức khỏe pin cho xe này"));

        return BatteryHealthResponse.fromEntity(health, vehicle);
    }
}
