package com.evshare.vehicle.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.vehicle.dto.CreateVehicleRequest;
import com.evshare.vehicle.dto.UpdateVehicleRequest;
import com.evshare.vehicle.dto.VehicleResponse;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(VehicleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        return VehicleResponse.fromEntity(vehicle);
    }

    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest request) {
        String licensePlate = request.getLicensePlate().trim().toUpperCase();
        if (vehicleRepository.existsByLicensePlate(licensePlate)) {
            throw new DuplicateResourceException("Vehicle with license plate already exists: " + licensePlate);
        }

        String vin = request.getVin().trim().toUpperCase();
        if (vehicleRepository.existsByVin(vin)) {
            throw new DuplicateResourceException("Vehicle with VIN already exists: " + vin);
        }

        if (request.getCurrentBatteryLevel() != null &&
                (request.getCurrentBatteryLevel() < 0 || request.getCurrentBatteryLevel() > 100)) {
            throw new IllegalArgumentException("Battery level must be between 0 and 100");
        }

        if (request.getOdometer() != null && request.getOdometer().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Odometer cannot be negative");
        }

        if (request.getBatteryCapacity() != null && request.getBatteryCapacity().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Battery capacity must be non-negative");
        }

        Vehicle vehicle = new Vehicle(
                UUID.randomUUID(),
                request.getName().trim(),
                request.getBrand().trim(),
                request.getModel().trim(),
                request.getYear(),
                licensePlate,
                vin,
                request.getBatteryCapacity(),
                request.getCurrentBatteryLevel(),
                request.getOdometer(),
                request.getStatus(),
                request.getModel3dUrl() != null && !request.getModel3dUrl().isBlank()
                        ? request.getModel3dUrl().trim()
                        : "/models/ev-car.glb"
        );

        Vehicle saved = vehicleRepository.save(vehicle);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse updateVehicle(UUID id, UpdateVehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (request.getLicensePlate() != null && !request.getLicensePlate().isBlank()) {
            String newPlate = request.getLicensePlate().trim().toUpperCase();
            if (!newPlate.equalsIgnoreCase(vehicle.getLicensePlate()) && vehicleRepository.existsByLicensePlate(newPlate)) {
                throw new DuplicateResourceException("Vehicle with license plate already exists: " + newPlate);
            }
            vehicle.setLicensePlate(newPlate);
        }

        if (request.getVin() != null && !request.getVin().isBlank()) {
            String newVin = request.getVin().trim().toUpperCase();
            if (!newVin.equalsIgnoreCase(vehicle.getVin()) && vehicleRepository.existsByVin(newVin)) {
                throw new DuplicateResourceException("Vehicle with VIN already exists: " + newVin);
            }
            vehicle.setVin(newVin);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            vehicle.setName(request.getName().trim());
        }

        if (request.getBrand() != null && !request.getBrand().isBlank()) {
            vehicle.setBrand(request.getBrand().trim());
        }

        if (request.getModel() != null && !request.getModel().isBlank()) {
            vehicle.setModel(request.getModel().trim());
        }

        if (request.getYear() != null) {
            if (request.getYear() < 1900 || request.getYear() > 2100) {
                throw new IllegalArgumentException("Vehicle year must be between 1900 and 2100");
            }
            vehicle.setYear(request.getYear());
        }

        if (request.getCurrentBatteryLevel() != null) {
            if (request.getCurrentBatteryLevel() < 0 || request.getCurrentBatteryLevel() > 100) {
                throw new IllegalArgumentException("Battery level must be between 0 and 100");
            }
            vehicle.setCurrentBatteryLevel(request.getCurrentBatteryLevel());
        }

        if (request.getOdometer() != null) {
            if (request.getOdometer().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Odometer cannot be negative");
            }
            vehicle.setOdometer(request.getOdometer());
        }

        if (request.getBatteryCapacity() != null) {
            if (request.getBatteryCapacity().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Battery capacity must be non-negative");
            }
            vehicle.setBatteryCapacity(request.getBatteryCapacity());
        }

        if (request.getStatus() != null) {
            vehicle.setStatus(request.getStatus());
        }

        if (request.getModel3dUrl() != null && !request.getModel3dUrl().isBlank()) {
            vehicle.setModel3dUrl(request.getModel3dUrl().trim());
        }

        Vehicle updated = vehicleRepository.save(vehicle);
        return VehicleResponse.fromEntity(updated);
    }
}
