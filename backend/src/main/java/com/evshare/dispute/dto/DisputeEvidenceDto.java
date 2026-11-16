package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeEvidence;

import java.time.Instant;
import java.util.UUID;

public record DisputeEvidenceDto(
        UUID id,
        UUID uploadedById,
        String uploadedByName,
        String title,
        String fileUrl,
        String fileType,
        Long fileSizeBytes,
        String integrityHash,
        Instant createdAt
) {
    public static DisputeEvidenceDto fromEntity(DisputeEvidence evidence) {
        if (evidence == null) return null;
        return new DisputeEvidenceDto(
                evidence.getId(),
                evidence.getUploadedBy() != null ? evidence.getUploadedBy().getId() : null,
                evidence.getUploadedBy() != null ? evidence.getUploadedBy().getFullName() : null,
                evidence.getTitle(),
                evidence.getFileUrl(),
                evidence.getFileType(),
                evidence.getFileSizeBytes(),
                evidence.getIntegrityHash(),
                evidence.getCreatedAt()
        );
    }
}

