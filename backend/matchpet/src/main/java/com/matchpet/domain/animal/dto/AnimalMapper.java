package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;

public final class AnimalMapper {
    private AnimalMapper() {}

    public static CardDto toCard(Animal a) {
        if (a == null) return null;

        // 엔티티에 라벨 컬럼이 없으므로 코드/원문을 그대로 노출
        String kindLabel  = a.getKindCd();
        String colorLabel = a.getColorCd();
        String thumb      = a.getPopfile(); // 썸네일 전용 필드는 없으므로 동일 사용
        String image      = a.getPopfile();

        return CardDto.builder()
                .desertionNo(a.getDesertionNo())
                .happenDt(a.getHappenDt() != null ? a.getHappenDt().toString() : null)
                .kind(kindLabel)
                .color(colorLabel)
                .sex(a.getSexCd())          // M/F/Q
                .neuter(a.getNeuterYn())    // Y/N/U
                .processState(a.getProcessState())
                .thumbnail(thumb)
                .image(image)
                .careName(a.getCareNm())
                .careTel(a.getCareTel())
                .careAddr(a.getCareAddr())
                .specialMark(a.getSpecialMark())
                .build();
    }
}
