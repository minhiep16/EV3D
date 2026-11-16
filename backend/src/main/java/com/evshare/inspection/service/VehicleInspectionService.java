package com.evshare.inspection.service;

import com.evshare.booking.entity.Booking;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.entity.DamageType;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.inspection.dto.CompleteInspectionRequest;
import com.evshare.inspection.dto.InspectionComparisonResponse;
import com.evshare.inspection.dto.InspectionComparisonResponse.ComparisonItem;
import com.evshare.inspection.dto.VehicleInspectionItemRequest;
import com.evshare.inspection.dto.VehicleInspectionResponse;
import com.evshare.inspection.entity.InspectionItemCondition;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.entity.VehicleInspection;
import com.evshare.inspection.entity.VehicleInspectionItem;
import com.evshare.inspection.repository.VehicleInspectionItemRepository;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VehicleInspectionService {

    private static final Logger log = LoggerFactory.getLogger(VehicleInspectionService.class);

    private final VehicleInspectionRepository inspectionRepository;
    private final VehicleInspectionItemRepository itemRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final DamageRecordRepository damageRecordRepository;
    private final TripRepository tripRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.handover.repository.VehicleHandoverRepository handoverRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.evshare.vehicle.service.VehicleService vehicleService;

    public VehicleInspectionService(
            VehicleInspectionRepository inspectionRepository,
            VehicleInspectionItemRepository itemRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            DamageRecordRepository damageRecordRepository,
            TripRepository tripRepository
    ) {
        this.inspectionRepository = inspectionRepository;
        this.itemRepository = itemRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.damageRecordRepository = damageRecordRepository;
        this.tripRepository = tripRepository;
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getLatestCompletedInspection(UUID vehicleId) {
        return getLatestCompletedInspection(vehicleId, null);
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getLatestCompletedInspection(UUID vehicleId, InspectionType type) {
        List<VehicleInspection> completed;
        if (type != null) {
            completed = inspectionRepository.findCompletedByVehicleIdAndTypeOrderByCompletedAtDesc(vehicleId, type);
        } else {
            completed = inspectionRepository.findCompletedByVehicleIdOrderByCompletedAtDesc(vehicleId);
        }
        if (completed == null || completed.isEmpty()) {
            return Optional.empty();
        }
        VehicleInspection target = completed.stream()
                .filter(i -> type != null || i.getInspectionType() != InspectionType.POST_TRIP)
                .findFirst()
                .orElse(completed.get(0));
        return Optional.of(enrichResponseMetrics(VehicleInspectionResponse.fromEntity(target), vehicleId));
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getActiveInspection(UUID vehicleId) {
        return getActiveInspection(vehicleId, null);
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getActiveInspection(UUID vehicleId, UserPrincipal principal) {
        if (principal != null && vehicleService != null) {
            // Enforce group membership and role authorization for CO_OWNER
            vehicleService.getVehicleById(vehicleId, principal);
        } else {
            vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện: " + vehicleId));
        }

        return inspectionRepository.findActiveByVehicleId(vehicleId)
                .map(i -> enrichResponseMetrics(VehicleInspectionResponse.fromEntity(i), vehicleId));
    }

    @Transactional(readOnly = true)
    public VehicleInspectionResponse getInspectionById(UUID inspectionId) {
        VehicleInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra: " + inspectionId));
        UUID vehicleId = inspection.getVehicle() != null ? inspection.getVehicle().getId() : null;
        return enrichResponseMetrics(VehicleInspectionResponse.fromEntity(inspection), vehicleId);
    }

    @Transactional
    public VehicleInspectionResponse startOrGetActiveInspection(UUID vehicleId, UUID staffId, InspectionType type, boolean forceNew) {
        if (!forceNew) {
            Optional<VehicleInspection> activeOpt = inspectionRepository.findActiveByVehicleId(vehicleId);
            if (activeOpt.isPresent()) {
                return enrichResponseMetrics(VehicleInspectionResponse.fromEntity(activeOpt.get()), vehicleId);
            }
        } else {
            // Close / abandon previous uncompleted draft sessions for this vehicle
            List<VehicleInspection> activeList = inspectionRepository.findInProgressByVehicleIdOrderByStartedAtDesc(vehicleId);
            if (!activeList.isEmpty()) {
                inspectionRepository.deleteAll(activeList);
                log.info("Abandoned {} previous in-progress inspection drafts for vehicle {} to start fresh session", activeList.size(), vehicleId);
            }
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện: " + vehicleId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffId));

        VehicleInspection inspection = new VehicleInspection(
                UUID.randomUUID(),
                vehicle,
                staff,
                type != null ? type : InspectionType.PRE_HANDOVER
        );

        VehicleInspection saved = inspectionRepository.save(inspection);
        return enrichResponseMetrics(VehicleInspectionResponse.fromEntity(saved), vehicleId);
    }

    @Transactional
    public VehicleInspectionResponse startOrGetActiveInspection(UUID vehicleId, UUID staffId, InspectionType type) {
        return startOrGetActiveInspection(vehicleId, staffId, type, false);
    }

    @Transactional
    public VehicleInspectionResponse recordInspectionItem(UUID inspectionId, VehicleInspectionItemRequest req, UUID staffId) {
        VehicleInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra: " + inspectionId));

        if (inspection.getStatus() == InspectionStatus.COMPLETED) {
            throw new IllegalStateException("Biên bản kiểm tra đã hoàn tất, không thể chỉnh sửa kết quả.");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffId));
        inspection.setInspectedBy(staff);

        String canonicalCode = normalizeCanonicalPartCode(req.getVehiclePartCode());

        VehicleInspectionItem item = itemRepository.findByInspectionIdAndVehiclePartCode(inspectionId, canonicalCode)
                .orElseGet(() -> new VehicleInspectionItem(
                        UUID.randomUUID(),
                        inspection,
                        canonicalCode,
                        req.getConditionStatus(),
                        req.getNote()
                ));

        item.setVehiclePartCode(canonicalCode);
        item.setConditionStatus(req.getConditionStatus());
        item.setNote(req.getNote());
        itemRepository.save(item);

        if (inspection.getItems() != null) {
            inspection.getItems().removeIf(i -> canonicalCode.equalsIgnoreCase(normalizeCanonicalPartCode(i.getVehiclePartCode())));
            inspection.getItems().add(item);
        }

        VehicleInspection saved = inspectionRepository.save(inspection);
        UUID vehicleId = saved.getVehicle() != null ? saved.getVehicle().getId() : null;
        return enrichResponseMetrics(VehicleInspectionResponse.fromEntity(saved), vehicleId);
    }

    private VehicleInspectionResponse enrichResponseMetrics(VehicleInspectionResponse resp, UUID vehicleId) {
        if (resp != null && vehicleId != null && damageRecordRepository != null) {
            List<DamageRecord> unresolved = damageRecordRepository
                    .findByVehicleIdAndStatusNot(vehicleId, DamageStatus.RESOLVED);
            long severe = unresolved.stream().filter(d -> d.getSeverity() == DamageSeverity.SEVERE).count();
            resp.setUnresolvedCriticalDamageCount((int) severe);
        }
        return resp;
    }

    @Transactional
    public VehicleInspectionResponse completeInspection(UUID inspectionId, CompleteInspectionRequest req, UUID staffId) {
        VehicleInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra: " + inspectionId));

        if (inspection.getItems() == null || inspection.getItems().isEmpty()) {
            throw new IllegalStateException("Cần kiểm tra đầy đủ các bộ phận bắt buộc trước khi hoàn tất biên bản kiểm tra.");
        }

        // Validate that all mandatory checkpoints for the vehicle are explicitly inspected
        Set<String> assessedParts = inspection.getItems().stream()
                .filter(i -> i.getVehiclePartCode() != null && i.getConditionStatus() != null)
                .map(i -> normalizeCanonicalPartCode(i.getVehiclePartCode()))
                .collect(Collectors.toSet());

        Set<String> missingCheckpoints = VehicleInspectionResponse.REQUIRED_CHECKPOINTS.stream()
                .filter(reqPart -> !assessedParts.contains(normalizeCanonicalPartCode(reqPart)))
                .collect(Collectors.toSet());

        if (!missingCheckpoints.isEmpty()) {
            throw new IllegalStateException(String.format(
                    "Chưa hoàn tất kiểm tra đầy đủ các bộ phận bắt buộc. Còn thiếu %d/%d hạng mục bắt buộc chưa đánh giá: %s",
                    missingCheckpoints.size(),
                    VehicleInspectionResponse.REQUIRED_CHECKPOINTS.size(),
                    String.join(", ", missingCheckpoints)
            ));
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffId));
        inspection.setInspectedBy(staff);

        InspectionOverallResult derivedResult = deriveOverallResult(inspection.getItems());
        // Invariant: If inspection has severe damage/cracks, overall result MUST be FAIL and cannot be overridden to PASS
        InspectionOverallResult resolvedResult;
        if (derivedResult == InspectionOverallResult.FAIL) {
            resolvedResult = InspectionOverallResult.FAIL;
        } else if (req != null && req.getOverallResult() != null) {
            resolvedResult = req.getOverallResult();
        } else {
            resolvedResult = derivedResult;
        }

        inspection.setOverallResult(resolvedResult);
        if (req != null && req.getSummaryNote() != null && !req.getSummaryNote().isBlank()) {
            inspection.setSummaryNote(req.getSummaryNote().trim());
        } else {
            inspection.setSummaryNote(generateDefaultSummary(resolvedResult, inspection.getItems()));
        }

        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection.setCompletedAt(Instant.now());

        VehicleInspection saved = inspectionRepository.save(inspection);

        // Synchronize and persist defective inspection assessments into authoritative DamageRecords
        persistDamagesForInspection(saved, staff);

        UUID vehicleId = saved.getVehicle() != null ? saved.getVehicle().getId() : null;
        return enrichResponseMetrics(VehicleInspectionResponse.fromEntity(saved), vehicleId);
    }

    private void persistDamagesForInspection(VehicleInspection inspection, User staff) {
        if (inspection.getItems() == null || inspection.getItems().isEmpty()) {
            return;
        }

        Vehicle vehicle = inspection.getVehicle();
        if (vehicle == null) {
            return;
        }

        Trip recentTrip = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicle.getId(), TripStatus.COMPLETED)
                .or(() -> tripRepository.findFirstByVehicleIdOrderByCreatedAtDesc(vehicle.getId()))
                .orElse(null);
        Booking recentBooking = recentTrip != null ? recentTrip.getBooking() : null;

        for (VehicleInspectionItem item : inspection.getItems()) {
            InspectionItemCondition condition = item.getConditionStatus();
            // GOOD assessments do not create damages and do not resolve existing damages
            if (condition == null || condition == InspectionItemCondition.GOOD) {
                continue;
            }

            String canonicalCode = normalizeCanonicalPartCode(item.getVehiclePartCode());
            DamageType damageType = mapConditionToDamageType(condition);
            DamageSeverity severity = mapConditionToSeverity(condition);

            // Deduplication & idempotency check:
            // Check if there is already an active unresolved damage record for this vehicle and component
            List<DamageRecord> existingUnresolved = damageRecordRepository
                    .findByVehicleIdAndVehiclePartCodeAndStatusNot(vehicle.getId(), canonicalCode, DamageStatus.RESOLVED);

            if (!existingUnresolved.isEmpty()) {
                // An unresolved damage record already exists for this component.
                // Do not create duplicate row. If a specific note was entered, append/update it.
                DamageRecord existing = existingUnresolved.get(0);
                if (item.getNote() != null && !item.getNote().isBlank()) {
                    String updatedNote = (existing.getNote() != null && !existing.getNote().isBlank())
                            ? existing.getNote() + " | [Biên bản " + inspection.getId().toString().substring(0, 8) + "]: " + item.getNote().trim()
                            : item.getNote().trim();
                    if (updatedNote.length() > 1000) {
                        updatedNote = updatedNote.substring(0, 1000);
                    }
                    existing.setNote(updatedNote);
                    damageRecordRepository.save(existing);
                }
                continue;
            }

            // No unresolved damage for this component yet -> create a new DamageRecord
            BigDecimal[] coords = getCanonicalPartCoordinates(canonicalCode);
            String note = item.getNote() != null && !item.getNote().isBlank()
                    ? item.getNote().trim()
                    : "Ghi nhận từ biên bản kiểm tra kỹ thuật 3D (" + condition.name() + ")";
            if (note.length() > 1000) {
                note = note.substring(0, 1000);
            }

            DamageRecord newDamage = new DamageRecord(
                    UUID.randomUUID(),
                    vehicle,
                    recentTrip,
                    recentBooking,
                    null,
                    canonicalCode,
                    damageType,
                    severity,
                    note,
                    coords[0],
                    coords[1],
                    coords[2],
                    staff
            );
            newDamage.setStatus(DamageStatus.OPEN);
            damageRecordRepository.save(newDamage);
        }
    }

    private DamageType mapConditionToDamageType(InspectionItemCondition condition) {
        if (condition == null) return DamageType.OTHER;
        switch (condition) {
            case CRACK:
                return DamageType.CRACK;
            case DENT:
                return DamageType.DENT;
            case SCRATCH:
                return DamageType.SCRATCH;
            case OTHER_DAMAGE:
            default:
                return DamageType.OTHER;
        }
    }

    private DamageSeverity mapConditionToSeverity(InspectionItemCondition condition) {
        if (condition == null) return DamageSeverity.MODERATE;
        switch (condition) {
            case CRACK:
                return DamageSeverity.SEVERE;
            case DENT:
                return DamageSeverity.MODERATE;
            case SCRATCH:
                return DamageSeverity.MINOR;
            case OTHER_DAMAGE:
            default:
                return DamageSeverity.MODERATE;
        }
    }

    public static String normalizeCanonicalPartCode(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            return "BODY";
        }
        String upper = rawCode.trim().toUpperCase().replace("-", "_");
        switch (upper) {
            case "BATTERY_PACK":
            case "PIN":
                return "BATTERY";
            case "FRONT_LEFT_DOOR":
            case "DOOR_FRONT_LEFT":
                return "DOOR_FL";
            case "FRONT_RIGHT_DOOR":
            case "DOOR_FRONT_RIGHT":
                return "DOOR_FR";
            case "REAR_LEFT_DOOR":
            case "DOOR_REAR_LEFT":
                return "DOOR_RL";
            case "REAR_RIGHT_DOOR":
            case "DOOR_REAR_RIGHT":
                return "DOOR_RR";
            case "FRONT_LEFT_WHEEL":
            case "WHEEL_FRONT_LEFT":
                return "WHEEL_FL";
            case "FRONT_RIGHT_WHEEL":
            case "WHEEL_FRONT_RIGHT":
                return "WHEEL_FR";
            case "REAR_LEFT_WHEEL":
            case "WHEEL_REAR_LEFT":
                return "WHEEL_RL";
            case "REAR_RIGHT_WHEEL":
            case "WHEEL_REAR_RIGHT":
                return "WHEEL_RR";
            case "FRONT_BUMPER":
            case "BUMPER_F":
                return "HEADLIGHTS";
            case "REAR_BUMPER":
            case "BUMPER_R":
                return "DIFFUSER";
            default:
                return upper;
        }
    }

    public static BigDecimal[] getCanonicalPartCoordinates(String canonicalCode) {
        switch (canonicalCode) {
            case "WHEEL_FL":
                return new BigDecimal[]{new BigDecimal("-0.8000"), new BigDecimal("0.3600"), new BigDecimal("1.3100")};
            case "WHEEL_FR":
                return new BigDecimal[]{new BigDecimal("0.8000"), new BigDecimal("0.3600"), new BigDecimal("1.3100")};
            case "WHEEL_RL":
                return new BigDecimal[]{new BigDecimal("-0.8000"), new BigDecimal("0.3600"), new BigDecimal("-1.3100")};
            case "WHEEL_RR":
                return new BigDecimal[]{new BigDecimal("0.8000"), new BigDecimal("0.3600"), new BigDecimal("-1.3100")};
            case "DOOR_FL":
                return new BigDecimal[]{new BigDecimal("-0.8800"), new BigDecimal("0.8000"), new BigDecimal("0.5500")};
            case "DOOR_FR":
                return new BigDecimal[]{new BigDecimal("0.8800"), new BigDecimal("0.8000"), new BigDecimal("0.5500")};
            case "DOOR_RL":
                return new BigDecimal[]{new BigDecimal("-0.8800"), new BigDecimal("0.8000"), new BigDecimal("-0.5000")};
            case "DOOR_RR":
                return new BigDecimal[]{new BigDecimal("0.8800"), new BigDecimal("0.8000"), new BigDecimal("-0.5000")};
            case "WINDSHIELD":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("1.1500"), new BigDecimal("0.4500")};
            case "BATTERY":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.2000"), BigDecimal.ZERO};
            case "CHARGING_PORT":
                return new BigDecimal[]{new BigDecimal("-0.9200"), new BigDecimal("0.8200"), new BigDecimal("-1.4000")};
            case "HOOD":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.8200"), new BigDecimal("1.2500")};
            case "ROOF":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("1.4500"), new BigDecimal("-0.3000")};
            case "HEADLIGHTS":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.7500"), new BigDecimal("1.7800")};
            case "TAILLIGHTS":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.9500"), new BigDecimal("-1.8200")};
            case "DIFFUSER":
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.3200"), new BigDecimal("-1.8000")};
            case "BODY":
            default:
                return new BigDecimal[]{BigDecimal.ZERO, new BigDecimal("0.6500"), BigDecimal.ZERO};
        }
    }

    private InspectionOverallResult deriveOverallResult(List<VehicleInspectionItem> items) {
        boolean hasSevereOrDamaged = items.stream().anyMatch(i ->
                i.getConditionStatus() == InspectionItemCondition.CRACK ||
                i.getConditionStatus() == InspectionItemCondition.OTHER_DAMAGE
        );
        if (hasSevereOrDamaged) {
            return InspectionOverallResult.FAIL;
        }

        boolean hasMinorIssues = items.stream().anyMatch(i ->
                i.getConditionStatus() == InspectionItemCondition.SCRATCH ||
                i.getConditionStatus() == InspectionItemCondition.DENT
        );
        if (hasMinorIssues) {
            return InspectionOverallResult.PASS_WITH_NOTES;
        }

        return InspectionOverallResult.PASS;
    }

    private String generateDefaultSummary(InspectionOverallResult result, List<VehicleInspectionItem> items) {
        long abnormal = items.stream().filter(i -> i.getConditionStatus() != InspectionItemCondition.GOOD).count();
        if (result == InspectionOverallResult.PASS) {
            return "Tất cả " + items.size() + " bộ phận đã kiểm tra đều đạt tiêu chuẩn kỹ thuật tốt.";
        }
        if (result == InspectionOverallResult.PASS_WITH_NOTES) {
            return "Đã kiểm tra " + items.size() + " bộ phận, ghi nhận " + abnormal + " điểm trầy xước/móp nhẹ. Đủ điều kiện bàn giao có lưu ý.";
        }
        return "Đã kiểm tra " + items.size() + " bộ phận, phát hiện " + abnormal + " hư hỏng nghiêm trọng hoặc nứt vỡ. Không đủ điều kiện bàn giao.";
    }

    /**
     * Compare pre-handover and post-trip inspections (Phase 2 Section 10).
     */
    @Transactional(readOnly = true)
    public InspectionComparisonResponse compareInspections(UUID preInspectionId, UUID postInspectionId) {
        VehicleInspection pre = inspectionRepository.findById(preInspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra trước bàn giao: " + preInspectionId));
        VehicleInspection post = inspectionRepository.findById(postInspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra sau trả xe: " + postInspectionId));

        InspectionComparisonResponse response = new InspectionComparisonResponse();
        response.setPreInspectionId(pre.getId());
        response.setPostInspectionId(post.getId());
        response.setVehicleId(post.getVehicle() != null ? post.getVehicle().getId() : (pre.getVehicle() != null ? pre.getVehicle().getId() : null));
        response.setPreInspectedAt(pre.getCompletedAt() != null ? pre.getCompletedAt() : pre.getStartedAt());
        response.setPostInspectedAt(post.getCompletedAt() != null ? post.getCompletedAt() : post.getStartedAt());
        response.setPreOverallResult(pre.getOverallResult());
        response.setPostOverallResult(post.getOverallResult());

        java.util.Map<String, VehicleInspectionItem> preMap = pre.getItems().stream()
                .collect(Collectors.toMap(VehicleInspectionItem::getVehiclePartCode, item -> item, (a, b) -> a));
        java.util.Map<String, VehicleInspectionItem> postMap = post.getItems().stream()
                .collect(Collectors.toMap(VehicleInspectionItem::getVehiclePartCode, item -> item, (a, b) -> a));

        java.util.Set<String> allParts = new java.util.LinkedHashSet<>();
        allParts.addAll(preMap.keySet());
        allParts.addAll(postMap.keySet());

        List<ComparisonItem> comparisonItems = new ArrayList<>();
        int newDamages = 0;

        for (String part : allParts) {
            VehicleInspectionItem preItem = preMap.get(part);
            VehicleInspectionItem postItem = postMap.get(part);

            InspectionItemCondition preCond = preItem != null ? preItem.getConditionStatus() : InspectionItemCondition.GOOD;
            InspectionItemCondition postCond = postItem != null ? postItem.getConditionStatus() : InspectionItemCondition.GOOD;
            String preNote = preItem != null ? preItem.getNote() : "";
            String postNote = postItem != null ? postItem.getNote() : "";

            String status;
            if (preCond == postCond) {
                status = (preCond == InspectionItemCondition.GOOD) ? "UNCHANGED" : "EXISTING_DAMAGE";
            } else if (preCond == InspectionItemCondition.GOOD && postCond != InspectionItemCondition.GOOD) {
                status = "NEW_DAMAGE";
                newDamages++;
            } else if (postCond == InspectionItemCondition.GOOD && preCond != InspectionItemCondition.GOOD) {
                status = "REPAIRED";
            } else {
                status = "WORSENED";
                newDamages++;
            }

            comparisonItems.add(new ComparisonItem(
                    part, preCond, postCond, status, preNote, postNote
            ));
        }

        response.setItems(comparisonItems);
        response.setTotalNewDamages(newDamages);
        response.setCleanPass(newDamages == 0);

        return response;
    }

    /**
     * Retrieve pre vs post inspection comparison for a specific trip.
     */
    @Transactional(readOnly = true)
    public InspectionComparisonResponse compareTripInspections(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi: " + tripId));

        VehicleInspection postInspection = trip.getReturnInspection();
        if (postInspection == null && trip.getVehicle() != null) {
            List<VehicleInspection> postList = inspectionRepository.findCompletedByVehicleIdAndTypeOrderByCompletedAtDesc(
                    trip.getVehicle().getId(), InspectionType.POST_TRIP);
            if (!postList.isEmpty()) {
                postInspection = postList.get(0);
            }
        }

        if (postInspection == null) {
            throw new ResourceNotFoundException("Chưa có biên bản kiểm tra trả xe cho chuyến đi này.");
        }

        VehicleInspection preInspection = null;
        if (handoverRepository != null && trip.getBooking() != null) {
            Optional<com.evshare.handover.entity.VehicleHandover> hoOpt = handoverRepository.findByBookingId(trip.getBooking().getId());
            if (hoOpt.isPresent() && hoOpt.get().getInspection() != null) {
                preInspection = hoOpt.get().getInspection();
            }
        }

        if (preInspection == null && trip.getVehicle() != null) {
            List<VehicleInspection> preList = inspectionRepository.findCompletedByVehicleIdAndTypeOrderByCompletedAtDesc(
                    trip.getVehicle().getId(), InspectionType.PRE_HANDOVER);
            if (!preList.isEmpty()) {
                preInspection = preList.get(0);
            }
        }

        if (preInspection == null) {
            throw new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra trước bàn giao tương ứng.");
        }

        InspectionComparisonResponse resp = compareInspections(preInspection.getId(), postInspection.getId());
        resp.setTripId(trip.getId());
        return resp;
    }
}
