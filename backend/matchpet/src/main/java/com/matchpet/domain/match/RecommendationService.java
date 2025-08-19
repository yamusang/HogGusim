// src/main/java/com/matchpet/domain/match/RecommendationService.java
package com.matchpet.domain.match;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.RecoPetDto;
import com.matchpet.web.dto.RecoManagerDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final AnimalRepository animalRepository;

    /**
     * 시니어별 추천 동물 (임시 로직):
     *  - 사진 있는 개체 우선
     *  - 최신 등록 우선
     *  - 추후 seniorId 기반 가중치 추가 가능
     */
    public Page<RecoPetDto> recommendPets(Long seniorId, String careNm, Pageable pageable) {
        // 최신순 정렬 (createdAt, id)
        Pageable sorted = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id")
        );

        // AVAILABLE + (옵션) careNm 필터
        Page<Animal> page = (careNm != null && !careNm.isBlank())
                ? animalRepository.findAvailableByCareNm(careNm, sorted)
                : animalRepository.findAvailableWithPhoto(sorted);

        return page.map(this::toRecoPet);
    }

    private RecoPetDto toRecoPet(Animal a) {
        double base = 0.6;
        double photoBoost = (a.getPopfile() != null && !a.getPopfile().isBlank()) ? 0.3 : 0.0;
        double recentBoost = 0.1; // createdAt 정렬로 간접 반영
        double score = Math.min(1.0, base + photoBoost + recentBoost);

        // breed(=종/품종): 엔티티에 breed 필드가 없으므로 kindCd에서 안전 추출
        String breed = sanitizeBreedFromKindCd(a.getKindCd());

        // 만약 Animal에 kindNm(사람이 읽기 쉬운 종명)이 있다면 아래 주석 해제해서 먼저 사용하세요.
        // if (breed == null || breed.isBlank()) {
        //     String kindNm = a.getKindNm(); // 엔티티에 있을 때만 사용
        //     if (kindNm != null && !kindNm.isBlank()) breed = kindNm.trim();
        // }

        return RecoPetDto.builder()
                .id(a.getId())
                .desertionNo(a.getDesertionNo())
                // Animal에 name 필드가 없으므로 null로 내려주고, 프론트에서 #id 폴백
                .name(null)
                .breed(breed)
                .age(a.getAge())
                .photoUrl(a.getPopfile())   // 프론트에서 toAbsoluteUrl 처리
                .matchScore(score)
                .build();
    }

    /**
     * kindCd가 사람이 읽을 수 없는 순수 숫자코드면 null 처리,
     * "[개] 시바견" 같은 접두 대괄호 표기가 있으면 제거.
     */
    private String sanitizeBreedFromKindCd(String kindCd) {
        if (kindCd == null || kindCd.isBlank()) return null;
        String v = kindCd.trim();
        // 숫자만 있으면 표시하지 않음
        if (v.matches("^\\d+$")) return null;
        // [개] 시바견 형태의 접두 브라켓 제거
        v = v.replaceFirst("^\\[[^\\]]+\\]\\s*", "");
        return v.isBlank() ? null : v;
    }

    /** 펫별 매니저 추천 (엔티티 없으면 임시 Mock) */
    public Page<RecoManagerDto> recommendManagers(Long seniorId, Long petId, Pageable pageable) {
        // TODO: 실제 매니저 엔티티/리포지토리 있으면 교체
        RecoManagerDto m1 = RecoManagerDto.builder()
                .id(101L).name("케어매니저 A").intro("강아지 산책 전문").matchScore(0.92).photoUrl(null).build();
        RecoManagerDto m2 = RecoManagerDto.builder()
                .id(102L).name("케어매니저 B").intro("고양이 케어 특화").matchScore(0.88).photoUrl(null).build();

        java.util.List<RecoManagerDto> list = java.util.List.of(m1, m2);
        return new PageImpl<>(list, pageable, list.size());
    }
}
