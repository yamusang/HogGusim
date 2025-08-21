package com.matchpet.auth.mapper;

import com.matchpet.auth.dto.SeniorMinimalDto;
import com.matchpet.auth.dto.SeniorMinimalUpsert;
import com.matchpet.domain.senior.entity.SeniorProfile;

public final class SeniorMinimalMapper {
    private SeniorMinimalMapper() {}

    public static void patchEntity(SeniorProfile target, SeniorMinimalUpsert req) {
        if (target == null || req == null) return;
        if (nb(req.getAddress()))         target.setAddress(req.getAddress());
        if (nb(req.getPhoneNumber()))     target.setPhoneNumber(req.getPhoneNumber());
        if (nb(req.getEmergencyContact()))target.setEmergencyContact(req.getEmergencyContact());
    }

    public static SeniorMinimalDto toDto(SeniorProfile p) {
        if (p == null) return null;
        return SeniorMinimalDto.builder()
                .userId(p.getUserId())
                .address(p.getAddress())
                .phoneNumber(p.getPhoneNumber())
                .emergencyContact(p.getEmergencyContact())
                .build();
    }

    private static boolean nb(String s) { return s != null && !s.isBlank(); }
}
