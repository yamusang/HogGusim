package com.matchpet.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 반려동물 + 매니저 추천쌍 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PairSuggestionDto {
    private RecoPetDto pet;           // 추천 동물 정보
    private RecoManagerDto manager;   // 추천 매니저 정보
}
