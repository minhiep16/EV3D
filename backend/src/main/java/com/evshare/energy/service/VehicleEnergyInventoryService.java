package com.evshare.energy.service;

import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.service.ChargingProgressService;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.energy.dto.TripEnergyCostResult;
import com.evshare.energy.dto.VehicleEnergyInventoryResponse;
import com.evshare.energy.dto.VehicleEnergyTransactionResponse;
import com.evshare.energy.entity.EnergyTransactionType;
import com.evshare.energy.entity.VehicleEnergyInventory;
import com.evshare.energy.entity.VehicleEnergyTransaction;
import com.evshare.energy.repository.VehicleEnergyInventoryRepository;
import com.evshare.energy.repository.VehicleEnergyTransactionRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.service.VehicleEnergyModelService;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupStatus;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class VehicleEnergyInventoryService {

    private static final Logger log = LoggerFactory.getLogger(VehicleEnergyInventoryService.class);

    public static final BigDecimal DEFAULT_ELECTRICITY_TARIFF_VND = new BigDecimal("3850.00");
    public static final BigDecimal ONE_HUNDRED = new BigDecimal("100.00");

    private final VehicleEnergyInventoryRepository inventoryRepository;
    private final VehicleEnergyTransactionRepository transactionRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleEnergyModelService energyModelService;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    public VehicleEnergyInventoryService(
            VehicleEnergyInventoryRepository inventoryRepository,
            VehicleEnergyTransactionRepository transactionRepository,
            VehicleRepository vehicleRepository,
            VehicleEnergyModelService energyModelService,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.vehicleRepository = vehicleRepository;
        this.energyModelService = energyModelService;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
    }

    /**
     * Retrieves or reconstructs/initializes the persistent energy inventory for a vehicle.
     */
    @Transactional
    public VehicleEnergyInventory getOrCreateInventory(Vehicle vehicle) {
        if (vehicle == null) {
            throw new IllegalArgumentException("Vehicle must not be null");
        }

        Optional<VehicleEnergyInventory> opt = inventoryRepository.findByVehicleId(vehicle.getId());
        if (opt.isPresent()) {
            return opt.get();
        }

        // Initialize from actual vehicle battery capacity and persisted SOC
        BigDecimal usableCapacity = energyModelService.resolveUsableCapacity(vehicle);
        BigDecimal currentSoc = vehicle.getCurrentBatteryLevel() != null
                ? new BigDecimal(vehicle.getCurrentBatteryLevel())
                : new BigDecimal("80.00");

        BigDecimal openingEnergy = currentSoc.multiply(usableCapacity)
                .divide(ONE_HUNDRED, 3, RoundingMode.HALF_UP);
        BigDecimal openingCost = openingEnergy.multiply(DEFAULT_ELECTRICITY_TARIFF_VND)
                .setScale(2, RoundingMode.HALF_UP);

        VehicleEnergyInventory inventory = new VehicleEnergyInventory(
                UUID.randomUUID(),
                vehicle,
                openingEnergy,
                openingCost,
                DEFAULT_ELECTRICITY_TARIFF_VND
        );

        inventory.setIsReconciliationRequired(true);
        inventory.setReconciliationNote("Khởi tạo ban đầu từ mức pin thực tế: cần đối soát đơn giá điện lịch sử.");

        VehicleEnergyInventory saved = inventoryRepository.save(inventory);

        // Record initial reconciliation adjustment transaction
        VehicleEnergyTransaction initTx = new VehicleEnergyTransaction(
                UUID.randomUUID(),
                saved,
                vehicle,
                EnergyTransactionType.RECONCILIATION_ADJUSTMENT,
                openingEnergy,
                openingCost,
                DEFAULT_ELECTRICITY_TARIFF_VND,
                openingEnergy,
                openingCost,
                DEFAULT_ELECTRICITY_TARIFF_VND,
                null,
                "HỆ THỐNG",
                saved.getId(),
                "Khởi tạo kho điện năng ban đầu từ telemetry xe (" + currentSoc + "% SOC, " + usableCapacity + " kWh dung lượng khả dụng)"
        );
        transactionRepository.save(initTx);

        log.info("Initialized VehicleEnergyInventory for vehicle {}: available {} kWh, total value {} VND, unit cost {} VND/kWh",
                vehicle.getId(), openingEnergy, openingCost, DEFAULT_ELECTRICITY_TARIFF_VND);

        return saved;
    }

    /**
     * Atomically records a completed charging session into the vehicle's energy inventory.
     * Computes net stored energy and updates weighted average energy cost per Section 6.
     * Guaranteed idempotent: does not duplicate inventory updates.
     */
    @Transactional
    public VehicleEnergyInventory recordChargingSessionCompletion(ChargingSession session) {
        if (session == null || session.getVehicle() == null) {
            return null;
        }

        // Idempotency check: prevent duplicate charging inventory inflow
        if (transactionRepository.existsBySourceReferenceIdAndTransactionType(session.getId(), EnergyTransactionType.CHARGING_INFLOW)) {
            log.info("Charging session {} already accounted in energy inventory. Skipping duplicate inflow.", session.getId());
            return inventoryRepository.findByVehicleId(session.getVehicle().getId()).orElse(null);
        }

        Vehicle vehicle = session.getVehicle();
        VehicleEnergyInventory inventory = getOrCreateInventory(vehicle);

        BigDecimal deliveredEnergy = session.getEnergyDeliveredKwh() != null
                ? session.getEnergyDeliveredKwh()
                : BigDecimal.ZERO;

        BigDecimal tariff = (session.getChargingStation() != null && session.getChargingStation().getPricePerKwh() != null
                && session.getChargingStation().getPricePerKwh().compareTo(BigDecimal.ZERO) > 0)
                ? session.getChargingStation().getPricePerKwh()
                : DEFAULT_ELECTRICITY_TARIFF_VND;

        // Net stored energy accounting for physical charging efficiency losses
        BigDecimal storedEnergy = deliveredEnergy.multiply(ChargingProgressService.CHARGING_EFFICIENCY)
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal energyLoss = deliveredEnergy.subtract(storedEnergy).max(BigDecimal.ZERO)
                .setScale(3, RoundingMode.HALF_UP);

        boolean isStaffCharging = session.getStartedBy() != null &&
                (session.getStartedBy().getRole() == Role.STAFF || session.getStartedBy().getRole() == Role.ADMIN);

        // When STAFF charges, session is an operational vehicle preparation activity:
        // Exempt from charging fees, no personal debt, but tariff is preserved and inventory value is maintained
        // so that subsequent trip consumption does not calculate trip electricity tariff as zero.
        BigDecimal chargingCost = isStaffCharging
                ? BigDecimal.ZERO
                : deliveredEnergy.multiply(tariff).setScale(2, RoundingMode.HALF_UP);

        // Snapshot authoritative values on ChargingSession
        session.setTariffPerKwh(tariff);
        session.setStoredEnergyKwh(storedEnergy);
        session.setChargingCost(chargingCost);
        session.setEnergyLossKwh(energyLoss);

        // Section 6: Weighted Average Cost formula
        BigDecimal prevValue = inventory.getTotalInventoryCost();
        BigDecimal prevEnergy = inventory.getAvailableEnergyKwh();

        // Stored energy maintains value at authoritative tariff to prevent diluting trip energy cost to zero
        BigDecimal energyValueToAdd = storedEnergy.multiply(tariff).setScale(2, RoundingMode.HALF_UP);

        BigDecimal newValue = prevValue.add(energyValueToAdd).max(BigDecimal.ZERO);
        BigDecimal newEnergy = prevEnergy.add(storedEnergy).max(BigDecimal.ZERO);

        BigDecimal newAvgCost = newEnergy.compareTo(BigDecimal.ZERO) > 0
                ? newValue.divide(newEnergy, 2, RoundingMode.HALF_UP)
                : tariff;

        inventory.setAvailableEnergyKwh(newEnergy);
        inventory.setTotalInventoryCost(newValue);
        inventory.setWeightedAverageCostPerKwh(newAvgCost);
        inventory.setTotalEnergyChargedKwh(inventory.getTotalEnergyChargedKwh().add(deliveredEnergy));
        inventory.setTotalCostCharged(inventory.getTotalCostCharged().add(isStaffCharging ? BigDecimal.ZERO : chargingCost));
        inventory.setLastChargingSessionId(session.getId());

        VehicleEnergyInventory saved = inventoryRepository.save(inventory);

        // Log transaction
        User operator = session.getStartedBy();
        String operatorName = operator != null ? operator.getFullName() : "Người dùng";
        UUID operatorId = operator != null ? operator.getId() : null;

        String txDescription = isStaffCharging
                ? String.format("Phiên sạc nhân viên vận hành %s: Nạp %s kWh (Lưu %s kWh) — Miễn phí sạc (Phục vụ vận hành)",
                        session.getId().toString().substring(0, 8), deliveredEnergy, storedEnergy)
                : String.format("Phiên sạc %s: Nạp %s kWh (Lưu %s kWh) @ %s đ/kWh",
                        session.getId().toString().substring(0, 8), deliveredEnergy, storedEnergy, tariff);

        VehicleEnergyTransaction tx = new VehicleEnergyTransaction(
                UUID.randomUUID(),
                saved,
                vehicle,
                EnergyTransactionType.CHARGING_INFLOW,
                storedEnergy,
                chargingCost,
                tariff,
                newEnergy,
                newValue,
                newAvgCost,
                operatorId,
                operatorName,
                session.getId(),
                txDescription
        );
        transactionRepository.save(tx);

        log.info("Recorded charging inflow for vehicle {}: +{} kWh (cost {} VND), new inventory: {} kWh, avg cost {} VND/kWh",
                vehicle.getId(), storedEnergy, chargingCost, newEnergy, newAvgCost);

        if (notificationService != null) {
            try {
                notificationService.notifyChargingCompleted(session, storedEnergy, chargingCost, newAvgCost);
            } catch (Exception ex) {
                log.warn("Failed to dispatch charging completion notification: {}", ex.getMessage());
            }
        }

        return saved;
    }

    /**
     * Atomically records trip energy consumption and deducts energy & value from inventory.
     * Guaranteed idempotent: if trip is already accounted, returns previous calculation.
     */
    @Transactional
    public TripEnergyCostResult recordTripConsumption(Trip trip, BigDecimal consumedEnergyKwh, User staffOrDriver) {
        if (trip == null || trip.getVehicle() == null) {
            throw new IllegalArgumentException("Trip and Vehicle must not be null");
        }

        BigDecimal effectiveKwh = consumedEnergyKwh != null && consumedEnergyKwh.compareTo(BigDecimal.ZERO) > 0
                ? consumedEnergyKwh
                : (trip.getEnergyConsumedKwh() != null ? trip.getEnergyConsumedKwh() : BigDecimal.ZERO);

        // Idempotency check
        if (transactionRepository.existsBySourceReferenceIdAndTransactionType(trip.getId(), EnergyTransactionType.TRIP_CONSUMPTION)) {
            log.info("Trip {} consumption already recorded in energy inventory. Returning existing cost basis.", trip.getId());
            VehicleEnergyInventory inv = getOrCreateInventory(trip.getVehicle());
            BigDecimal unitPrice = inv.getWeightedAverageCostPerKwh().compareTo(BigDecimal.ZERO) > 0
                    ? inv.getWeightedAverageCostPerKwh()
                    : DEFAULT_ELECTRICITY_TARIFF_VND;
            BigDecimal totalExpense = effectiveKwh.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);
            return new TripEnergyCostResult(effectiveKwh, unitPrice, totalExpense, Boolean.TRUE.equals(inv.getIsReconciliationRequired()));
        }

        Vehicle vehicle = trip.getVehicle();
        VehicleEnergyInventory inventory = getOrCreateInventory(vehicle);

        BigDecimal applicableUnitCost = inventory.getWeightedAverageCostPerKwh();
        if (applicableUnitCost == null || applicableUnitCost.compareTo(BigDecimal.ZERO) <= 0) {
            applicableUnitCost = DEFAULT_ELECTRICITY_TARIFF_VND;
            inventory.setIsReconciliationRequired(true);
        }

        BigDecimal tripEnergyExpense = effectiveKwh.multiply(applicableUnitCost)
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal newAvailableEnergy = inventory.getAvailableEnergyKwh().subtract(effectiveKwh).max(BigDecimal.ZERO)
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal newInventoryValue = inventory.getTotalInventoryCost().subtract(tripEnergyExpense).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        // If inventory drops to 0, reset value to 0
        if (newAvailableEnergy.compareTo(BigDecimal.ZERO) == 0) {
            newInventoryValue = BigDecimal.ZERO;
        }

        inventory.setAvailableEnergyKwh(newAvailableEnergy);
        inventory.setTotalInventoryCost(newInventoryValue);
        inventory.setTotalEnergyConsumedKwh(inventory.getTotalEnergyConsumedKwh().add(effectiveKwh));
        inventory.setTotalCostConsumed(inventory.getTotalCostConsumed().add(tripEnergyExpense));
        inventory.setLastTripId(trip.getId());

        VehicleEnergyInventory saved = inventoryRepository.save(inventory);

        User driver = trip.getUser();
        UUID driverId = driver != null ? driver.getId() : null;
        String driverName = driver != null ? driver.getFullName() : (staffOrDriver != null ? staffOrDriver.getFullName() : "Người lái");

        VehicleEnergyTransaction tx = new VehicleEnergyTransaction(
                UUID.randomUUID(),
                saved,
                vehicle,
                EnergyTransactionType.TRIP_CONSUMPTION,
                effectiveKwh.negate(),
                tripEnergyExpense.negate(),
                applicableUnitCost,
                newAvailableEnergy,
                newInventoryValue,
                inventory.getWeightedAverageCostPerKwh(),
                driverId,
                driverName,
                trip.getId(),
                String.format("Tiêu thụ chuyến đi #%s: %s kWh @ %s đ/kWh = %s đ",
                        trip.getId().toString().substring(0, 8), effectiveKwh, applicableUnitCost, tripEnergyExpense)
        );
        transactionRepository.save(tx);

        log.info("Recorded trip consumption for vehicle {}: -{} kWh (expense {} VND @ {} đ/kWh), remaining inventory: {} kWh",
                vehicle.getId(), effectiveKwh, tripEnergyExpense, applicableUnitCost, newAvailableEnergy);

        return new TripEnergyCostResult(
                effectiveKwh,
                applicableUnitCost,
                tripEnergyExpense,
                Boolean.TRUE.equals(saved.getIsReconciliationRequired())
        );
    }

    /**
     * Validates vehicle access permissions according to role:
     * - STAFF: authorized operational vehicles across garage.
     * - ADMIN: authorized fleet vehicles.
     * - CO_OWNER: vehicles within authorized ownership group.
     */
    public void validateVehicleAccess(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để xem thông tin kho điện năng.");
        }

        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Phương tiện không tồn tại: " + vehicleId);
        }

        Role userRole = principal.getUser().getRole();
        if (userRole == Role.CO_OWNER) {
            // Strict Authorization: CO_OWNER can only view energy inventory for their authorized co-owned vehicle
            UUID userId = principal.getId();
            List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
            boolean hasAccess = false;
            for (GroupMember member : activeMemberships) {
                if (member.getRemovedAt() != null) {
                    continue;
                }
                CoOwnershipGroup group = member.getGroup();
                if (group != null && group.getStatus() == GroupStatus.ACTIVE) {
                    if (vehicleId.equals(group.getVehicleId())) {
                        hasAccess = true;
                        break;
                    }
                    List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
                    for (GroupVehicle gv : gvs) {
                        if (gv.getVehicle() != null && vehicleId.equals(gv.getVehicle().getId())) {
                            hasAccess = true;
                            break;
                        }
                    }
                    if (hasAccess) {
                        break;
                    }
                }
            }
            if (!hasAccess) {
                throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu kho điện năng của xe này.");
            }
        } else if (userRole != Role.STAFF && userRole != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu kho điện năng của xe này.");
        }
    }

    @Transactional
    public VehicleEnergyInventoryResponse getInventoryResponse(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);
        return getInventoryResponse(vehicleId);
    }

    @Transactional
    public VehicleEnergyInventoryResponse getInventoryResponse(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Phương tiện không tồn tại: " + vehicleId));
        VehicleEnergyInventory inventory = inventoryRepository.findByVehicleId(vehicleId)
                .orElseGet(() -> getOrCreateInventory(vehicle));
        return VehicleEnergyInventoryResponse.fromEntity(inventory);
    }

    @Transactional(readOnly = true)
    public List<VehicleEnergyTransactionResponse> getTransactionHistory(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);
        return getTransactionHistory(vehicleId);
    }

    @Transactional(readOnly = true)
    public List<VehicleEnergyTransactionResponse> getTransactionHistory(UUID vehicleId) {
        return transactionRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId).stream()
                .map(VehicleEnergyTransactionResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
