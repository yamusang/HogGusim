package com.matchpet.web.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class ApplicationRow {
    private Long id;
    private Long animalId;
    private String animalName; // 필요시 breed/번호 등으로 채우기
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reservedAt;
    private String note;
}
