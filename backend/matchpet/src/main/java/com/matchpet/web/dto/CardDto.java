package com.matchpet.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 동물 목록/상세 카드 응답 DTO.
 * AnimalMapper.toCard(Animal)에서 아래 필드들을 채웁니다.
 *
 * id            : 동물 PK
 * thumbnailUrl  : 썸네일(없으면 popfile 등으로 대체)
 * species       : 종/분류(원본 kindCd)
 * breed         : 품종(현재 kindCd와 동일하게 매핑)
 * sexLabel      : "수컷"/"암컷"/"-"
 * neuterLabel   : "예"/"아니오"/"-"
 * ageText       : 나이 문자열(원본 age 그대로)
 * color         : 색상(원본 colorCd)
 * status        : 서비스 상태(AVAILABLE/MATCHING/CONNECTED/RETURNED)
 * shelterName   : 보호소명(careNm)
 */
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardDto {
    private Long   id;
    private String thumbnailUrl;
    private String species;
    private String breed;
    private String sexLabel;
    private String neuterLabel;
    private String ageText;
    private String color;
    private String status;
    private String shelterName;
}
