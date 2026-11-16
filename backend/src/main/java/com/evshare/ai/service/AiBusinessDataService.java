package com.evshare.ai.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.dispute.entity.Dispute;
import com.evshare.dispute.repository.DisputeRepository;
import com.evshare.expense.dto.CostSharingSummaryResponse;
import com.evshare.expense.service.ExpenseShareService;
import com.evshare.fund.dto.SharedFundSummaryResponse;
import com.evshare.fund.service.SharedFundService;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.voting.entity.VoteProposal;
import com.evshare.voting.entity.VoteProposalStatus;
import com.evshare.voting.repository.VoteProposalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AiBusinessDataService {

    private final VehicleRepository vehicleRepository;
    private final DamageRecordRepository damageRecordRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final ExpenseShareService expenseShareService;
    private final SharedFundService sharedFundService;
    private final VoteProposalRepository voteProposalRepository;
    private final DisputeRepository disputeRepository;
    private final VehicleHandoverRepository vehicleHandoverRepository;

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    public AiBusinessDataService(
            VehicleRepository vehicleRepository,
            DamageRecordRepository damageRecordRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            ExpenseShareService expenseShareService,
            SharedFundService sharedFundService,
            VoteProposalRepository voteProposalRepository,
            DisputeRepository disputeRepository,
            VehicleHandoverRepository vehicleHandoverRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.damageRecordRepository = damageRecordRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.expenseShareService = expenseShareService;
        this.sharedFundService = sharedFundService;
        this.voteProposalRepository = voteProposalRepository;
        this.disputeRepository = disputeRepository;
        this.vehicleHandoverRepository = vehicleHandoverRepository;
    }

    public Optional<Vehicle> resolveVehicle(String vehicleIdOrCode) {
        if (vehicleIdOrCode == null || vehicleIdOrCode.isBlank()) {
            return vehicleRepository.findAll().stream().findFirst();
        }

        try {
            UUID uuid = UUID.fromString(vehicleIdOrCode);
            Optional<Vehicle> byId = vehicleRepository.findById(uuid);
            if (byId.isPresent()) return byId;
        } catch (IllegalArgumentException ignored) {}

        Optional<Vehicle> byPlate = vehicleRepository.findByLicensePlateIgnoreCase(vehicleIdOrCode.trim());
        if (byPlate.isPresent()) return byPlate;

        Optional<Vehicle> byVin = vehicleRepository.findByVinIgnoreCase(vehicleIdOrCode.trim());
        if (byVin.isPresent()) return byVin;

        // Try fuzzy name match (e.g. "EV01", "Tesla", "VF3")
        return vehicleRepository.findAll().stream()
                .filter(v -> (v.getName() != null && v.getName().toLowerCase().contains(vehicleIdOrCode.toLowerCase())) ||
                             (v.getModel() != null && v.getModel().toLowerCase().contains(vehicleIdOrCode.toLowerCase())))
                .findFirst();
    }

    public String getFormattedTimestamp() {
        return TIME_FORMATTER.format(Instant.now());
    }

    public Map<String, Object> collectGroundedContext(Vehicle vehicle, UserPrincipal currentUser) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("asOf", getFormattedTimestamp());
        context.put("userRole", currentUser.getUser() != null ? currentUser.getUser().getRole().name() : "GUEST");
        context.put("userId", currentUser.getId().toString());

        if (vehicle != null) {
            Map<String, Object> vInfo = new LinkedHashMap<>();
            vInfo.put("id", vehicle.getId().toString());
            vInfo.put("name", vehicle.getName());
            vInfo.put("brand", vehicle.getBrand());
            vInfo.put("model", vehicle.getModel());
            vInfo.put("licensePlate", vehicle.getLicensePlate());
            vInfo.put("batterySoc", vehicle.getCurrentBatteryLevel() + "%");
            vInfo.put("odometerKm", vehicle.getOdometer() != null ? vehicle.getOdometer().toPlainString() + " km" : "Chưa xác định");
            vInfo.put("status", vehicle.getStatus().name());
            context.put("vehicle", vInfo);

            // Active damages / inspection
            List<DamageRecord> damages = damageRecordRepository.findByVehicleIdAndStatusNot(vehicle.getId(), DamageStatus.RESOLVED);
            context.put("unresolvedDamageCount", damages.size());

            // Active maintenance
            List<MaintenanceRequest> maintenance = maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicle.getId());
            context.put("maintenanceCount", maintenance.size());

            // Active trips
            Optional<Trip> activeTrip = tripRepository.findActiveTripByVehicleId(vehicle.getId());
            context.put("hasActiveTrip", activeTrip.isPresent());

            // Active handovers
            List<VehicleHandover> handovers = vehicleHandoverRepository.findActiveByVehicleId(vehicle.getId());
            context.put("activeHandoverCount", handovers.size());

            // Open voting proposals
            List<VoteProposal> openProposals = voteProposalRepository.findByVehicleIdAndStatusOrderByCreatedAtDesc(vehicle.getId(), VoteProposalStatus.OPEN);
            context.put("openProposalCount", openProposals.size());
        }

        // Financial & personal balance for CO_OWNER
        if (currentUser.getUser() != null && currentUser.getUser().getRole() == Role.CO_OWNER && vehicle != null) {
            try {
                CostSharingSummaryResponse finance = expenseShareService.getCostSharingSummary(
                        vehicle.getId(), YearMonth.now().toString(), currentUser
                );
                if (finance != null) {
                    Map<String, Object> fMap = new LinkedHashMap<>();
                    fMap.put("userSharePercentage", finance.userOwnershipPercentage() + "%");
                    fMap.put("userTotalDueVnd", finance.userRequiredShare() != null ? finance.userRequiredShare().toPlainString() + " ₫" : "0 ₫");
                    fMap.put("userVerifiedPaidVnd", finance.userPaidAmount() != null ? finance.userPaidAmount().toPlainString() + " ₫" : "0 ₫");
                    fMap.put("userOutstandingVnd", finance.getUserOutstandingAmount().toPlainString() + " ₫");
                    context.put("personalFinance", fMap);
                }
            } catch (Exception ignored) {}

            try {
                SharedFundSummaryResponse fund = sharedFundService.getFundSummaryByVehicle(vehicle.getId(), currentUser);
                if (fund != null) {
                    Map<String, Object> fundMap = new LinkedHashMap<>();
                    fundMap.put("availableBalanceVnd", fund.availableBalance() != null ? fund.availableBalance().toPlainString() + " ₫" : "0 ₫");
                    context.put("sharedFund", fundMap);
                }
            } catch (Exception ignored) {}
        }

        return context;
    }

    public List<DamageRecord> getUnresolvedDamages(UUID vehicleId) {
        return damageRecordRepository.findByVehicleIdAndStatusNot(vehicleId, DamageStatus.RESOLVED);
    }

    public List<MaintenanceRequest> getMaintenanceRecords(UUID vehicleId) {
        return maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }

    public List<Booking> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    public List<Booking> getVehicleUpcomingBookings(UUID vehicleId) {
        return bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
    }

    public Optional<Trip> getActiveTrip(UUID vehicleId) {
        return tripRepository.findActiveTripByVehicleId(vehicleId);
    }

    public Optional<Trip> getLatestCompletedTrip(UUID vehicleId, UUID userId) {
        return tripRepository.findFirstByVehicleIdAndUserIdAndStatusOrderByEndedAtDesc(vehicleId, userId, TripStatus.COMPLETED);
    }

    public CostSharingSummaryResponse getPersonalFinance(UUID vehicleId, UserPrincipal currentUser) {
        try {
            return expenseShareService.getCostSharingSummary(vehicleId, YearMonth.now().toString(), currentUser);
        } catch (Exception e) {
            return null;
        }
    }

    public SharedFundSummaryResponse getSharedFund(UUID vehicleId, UserPrincipal currentUser) {
        try {
            return sharedFundService.getFundSummaryByVehicle(vehicleId, currentUser);
        } catch (Exception e) {
            return null;
        }
    }

    public List<VoteProposal> getOpenVoteProposals(UUID vehicleId) {
        return voteProposalRepository.findByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, VoteProposalStatus.OPEN);
    }

    public List<Dispute> getInvolvedDisputes(UUID vehicleId, UUID userId, boolean isStaff) {
        if (isStaff) {
            return disputeRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        }
        return disputeRepository.findInvolvedDisputesForUserAndVehicle(vehicleId, userId);
    }

    public List<VehicleHandover> getActiveHandovers(UUID vehicleId) {
        return vehicleHandoverRepository.findActiveByVehicleId(vehicleId);
    }
}

