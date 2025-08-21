package com.matchpet.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SeniorMinimalDto {
    private Long userId;
    private String address;
    private String phoneNumber;
    private String emergencyContact;
}
