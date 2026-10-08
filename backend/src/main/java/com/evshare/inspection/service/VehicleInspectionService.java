package com.evshare.inspection.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.inspection.dto.CompleteInspectionRequest;
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
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VehicleInspectionService {

    private final VehicleInspectionRepository inspectionRepository;
    private final VehicleInspectionItemRepository itemRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleInspectionService(
            VehicleInspectionRepository inspectionRepository,
            VehicleInspectionItemRepository itemRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository
    ) {
        this.inspectionRepository = inspectionRepository;
        this.itemRepository = itemRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getLatestCompletedInspection(UUID vehicleId) {
        return getLatestCompletedInspection(vehicleId, InspectionType.PRE_HANDOVER);
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getLatestCompletedInspection(UUID vehicleId, InspectionType type) {
        if (type != null) {
            Optional<VehicleInspection> typeMatch = inspectionRepository.findLatestCompletedByVehicleIdAndType(vehicleId, type);
            if (typeMatch.isPresent()) {
                return typeMatch.map(VehicleInspectionResponse::fromEntity);
            }
        }
        return inspectionRepository.findLatestCompletedByVehicleId(vehicleId)
                .map(VehicleInspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<VehicleInspectionResponse> getActiveInspection(UUID vehicleId) {
        return inspectionRepository.findActiveByVehicleId(vehicleId)
                .map(VehicleInspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public VehicleInspectionResponse getInspectionById(UUID inspectionId) {
        VehicleInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra: " + inspectionId));
        return VehicleInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public VehicleInspectionResponse startOrGetActiveInspection(UUID vehicleId, UUID staffId, InspectionType type) {
        Optional<VehicleInspection> activeOpt = inspectionRepository.findActiveByVehicleId(vehicleId);
        if (activeOpt.isPresent()) {
            return VehicleInspectionResponse.fromEntity(activeOpt.get());
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
        return VehicleInspectionResponse.fromEntity(saved);
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

        String partCode = req.getVehiclePartCode().trim().toUpperCase();

        VehicleInspectionItem item = itemRepository.findByInspectionIdAndVehiclePartCode(inspectionId, partCode)
                .orElseGet(() -> new VehicleInspectionItem(
                        UUID.randomUUID(),
                        inspection,
                        partCode,
                        req.getConditionStatus(),
                        req.getNote()
                ));

        item.setConditionStatus(req.getConditionStatus());
        item.setNote(req.getNote());
        itemRepository.save(item);

        if (!inspection.getItems().contains(item)) {
            inspection.getItems().add(item);
        }

        VehicleInspection saved = inspectionRepository.save(inspection);
        return VehicleInspectionResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleInspectionResponse completeInspection(UUID inspectionId, CompleteInspectionRequest req, UUID staffId) {
        VehicleInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản kiểm tra: " + inspectionId));

        if (inspection.getItems().isEmpty()) {
            throw new IllegalStateException("Cần kiểm tra ít nhất một bộ phận trước khi hoàn tất biên bản.");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffId));
        inspection.setInspectedBy(staff);

        InspectionOverallResult resolvedResult = req != null && req.getOverallResult() != null
                ? req.getOverallResult()
                : deriveOverallResult(inspection.getItems());

        inspection.setOverallResult(resolvedResult);
        if (req != null && req.getSummaryNote() != null && !req.getSummaryNote().isBlank()) {
            inspection.setSummaryNote(req.getSummaryNote().trim());
        } else {
            inspection.setSummaryNote(generateDefaultSummary(resolvedResult, inspection.getItems()));
        }

        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection.setCompletedAt(Instant.now());

        VehicleInspection saved = inspectionRepository.save(inspection);
        return VehicleInspectionResponse.fromEntity(saved);
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
}
