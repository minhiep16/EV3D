package com.evshare.trip.service;

import com.evshare.trip.dto.TripEnergyCalculationResult;
import com.evshare.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class VehicleEnergyModelService {

    // EV01 — realistic compact electric SUV, Volvo EX30-like:
    public static final BigDecimal EV01_GROSS_BATTERY_CAPACITY_KWH = new BigDecimal("69.00");
    public static final BigDecimal EV01_USABLE_BATTERY_CAPACITY_KWH = new BigDecimal("65.00");
    public static final BigDecimal EV01_ENERGY_CONSUMPTION_KWH_PER_100KM = new BigDecimal("17.50");

    // EV02 — lighter stylized EV:
    public static final BigDecimal EV02_GROSS_BATTERY_CAPACITY_KWH = new BigDecimal("65.00");
    public static final BigDecimal EV02_USABLE_BATTERY_CAPACITY_KWH = new BigDecimal("60.00");
    public static final BigDecimal EV02_ENERGY_CONSUMPTION_KWH_PER_100KM = new BigDecimal("16.50");

    public static final BigDecimal ONE_HUNDRED = new BigDecimal("100.00");

    public BigDecimal resolveGrossCapacity(Vehicle vehicle) {
        if (vehicle != null && vehicle.getGrossBatteryCapacityKwh() != null && vehicle.getGrossBatteryCapacityKwh().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getGrossBatteryCapacityKwh();
        }
        if (vehicle != null && vehicle.getName() != null && vehicle.getName().contains("EV02")) {
            return EV02_GROSS_BATTERY_CAPACITY_KWH;
        }
        return EV01_GROSS_BATTERY_CAPACITY_KWH;
    }

    public BigDecimal resolveUsableCapacity(Vehicle vehicle) {
        if (vehicle != null && vehicle.getUsableBatteryCapacityKwh() != null && vehicle.getUsableBatteryCapacityKwh().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getUsableBatteryCapacityKwh();
        }
        if (vehicle != null && vehicle.getName() != null && vehicle.getName().contains("EV02")) {
            return EV02_USABLE_BATTERY_CAPACITY_KWH;
        }
        return EV01_USABLE_BATTERY_CAPACITY_KWH;
    }

    public BigDecimal resolveConsumptionKwhPer100Km(Vehicle vehicle) {
        if (vehicle != null && vehicle.getEnergyConsumptionKwhPer100Km() != null && vehicle.getEnergyConsumptionKwhPer100Km().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getEnergyConsumptionKwhPer100Km();
        }
        if (vehicle != null && vehicle.getName() != null && vehicle.getName().contains("EV02")) {
            return EV02_ENERGY_CONSUMPTION_KWH_PER_100KM;
        }
        return EV01_ENERGY_CONSUMPTION_KWH_PER_100KM;
    }

    /**
     * Authoritative Trip Consumption Calculation:
     * distanceKm = endOdometerKm - startOdometerKm
     * energyConsumedKwh = distanceKm * energyConsumptionKwhPer100Km / 100
     * socConsumedPercent = energyConsumedKwh / usableBatteryCapacityKwh * 100
     * endSocPercent = max(0, startSocPercent - socConsumedPercent)
     */
    public TripEnergyCalculationResult calculateTripConsumption(
            BigDecimal startOdometerKm,
            BigDecimal endOdometerKm,
            BigDecimal startSocPercent,
            Vehicle vehicle
    ) {
        BigDecimal startOdo = startOdometerKm != null ? startOdometerKm : BigDecimal.ZERO;
        BigDecimal endOdo = endOdometerKm != null ? endOdometerKm : startOdo;
        BigDecimal distanceKm = endOdo.subtract(startOdo).max(BigDecimal.ZERO);

        BigDecimal consumptionKwhPer100Km = resolveConsumptionKwhPer100Km(vehicle);
        BigDecimal usableCapacityKwh = resolveUsableCapacity(vehicle);

        BigDecimal energyConsumedKwh = distanceKm.multiply(consumptionKwhPer100Km)
                .divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP);

        BigDecimal socConsumedPercent = usableCapacityKwh.compareTo(BigDecimal.ZERO) > 0
                ? energyConsumedKwh.divide(usableCapacityKwh, 6, RoundingMode.HALF_UP).multiply(ONE_HUNDRED)
                : BigDecimal.ZERO;

        BigDecimal startSoc = startSocPercent != null ? startSocPercent : ONE_HUNDRED;
        BigDecimal endSocPercent = startSoc.subtract(socConsumedPercent).max(BigDecimal.ZERO);

        return new TripEnergyCalculationResult(
                distanceKm.setScale(2, RoundingMode.HALF_UP),
                energyConsumedKwh.setScale(3, RoundingMode.HALF_UP),
                socConsumedPercent.setScale(2, RoundingMode.HALF_UP),
                endSocPercent.setScale(2, RoundingMode.HALF_UP),
                consumptionKwhPer100Km.setScale(2, RoundingMode.HALF_UP),
                usableCapacityKwh.setScale(2, RoundingMode.HALF_UP)
        );
    }
}
