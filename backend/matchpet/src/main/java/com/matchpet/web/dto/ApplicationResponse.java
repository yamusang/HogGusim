package com.matchpet.web.dto;

import com.matchpet.domain.application.entity.Application;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ApplicationResponse {
    private Long id;
    private Long seniorId;
    private Long animalId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reservedAt;
    private String note;

    public static ApplicationResponse from(Application a) {
        return ApplicationResponse.builder()
            .id(a.getId())
            .seniorId(a.getSeniorId())
            .animalId(a.getAnimalId())
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .reservedAt(a.getReservedAt())
            .note(a.getNote())
            .build();
    }
}
