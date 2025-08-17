package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;

public final class AnimalMapper {
    private AnimalMapper() {}

    public static CardDto toCard(Animal a) {
        if (a == null) return null;
        return CardDto.builder()
                .desertionNo(a.getDesertionNo())
                .happenDt(a.getHappenDt() != null ? a.getHappenDt().toString() : null)
                .kind(a.getKindCd())              // 품종(전체 문자열)
                .color(a.getColorCd())
                .sex(a.getSexCd())                // M/F/Q
                .neuter(a.getNeuterYn())          // Y/N/U
                .processState(a.getProcessState())
                .thumbnail(a.getFilename())       // 썸네일
                .image(a.getPopfile())            // 원본
                .careName(a.getCareNm())
                .careTel(a.getCareTel())
                .careAddr(a.getCareAddr())
                .specialMark(a.getSpecialMark())
                .build();
    }
}
