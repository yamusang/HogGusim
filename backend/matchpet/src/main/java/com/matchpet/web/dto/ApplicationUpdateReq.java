package com.matchpet.web.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ApplicationUpdateReq {
    private LocalDateTime reservedAt; // null이면 변경 안 함
    private String note;              // null이면 변경 안 함
}
