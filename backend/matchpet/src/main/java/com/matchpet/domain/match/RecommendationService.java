// src/main/java/com/matchpet/domain/match/RecommendationService.java
package com.matchpet.domain.match;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
import com.matchpet.web.dto.RecoPetDto;
import com.matchpet.web.dto.RecoManagerDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final SeniorProfileRepository seniorRepo;
    private final AnimalRepository animalRepo;

    /**
     * 시니어별 추천 동물 (프로필 없으면 기본 목록/점수로 폴백)
     */
    public Page<RecoPetDto> recommendPets(Long seniorId, Pageable pageable) {
        var senior = seniorRepo.findById(seniorId).orElse(null); // ← orElseThrow 제거
        log.info("recommendPets seniorId={} profile? {}", seniorId, senior != null);

        Page<Animal> page = animalRepo.findAll(
            PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                           Sort.by(Sort.Direction.DESC, "id"))
        );

        List<RecoPetDto> content = page.getContent().stream()
            .map(a -> toRecoPet(senior, a))
            .toList();

        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    /** Animal → RecoPetDto (프론트가 쓰는 필드명에 정확히 맞춤) */
    private RecoPetDto toRecoPet(SeniorProfile senior, Animal a) {
        // 기본 점수 + 가벼운 가산점 (원하면 실제 선호도 반영 로직에 교체)
        double base = 0.6;
        double photoBoost = hasText(a.getPopfile()) || hasText(a.getFilename()) ? 0.3 : 0.0;
        double recentBoost = 0.1;
        double score = Math.min(1.0, base + photoBoost + recentBoost);
        if (senior == null) {
            // 프로필 없으면 점수만 기본으로 둠 (정렬은 최신 우선)
        } else {
            // TODO: senior의 선호(크기, 성별, 성격 등)로 score 가감
        }

        String breed = sanitizeBreedFromKindCd(a.getKindCd());     // "[개] 시바견" → "시바견"
        String photoUrl = hasText(a.getPopfile()) ? a.getPopfile()
                        : hasText(a.getFilename()) ? a.getFilename()
                        : null;

        return RecoPetDto.builder()
            .id(a.getId())
            .desertionNo(a.getDesertionNo())
            .name(null)                 // Animal에 name 없으면 null 유지
            .breed(breed)
            .age(a.getAge())            // 문자열 컬럼 그대로 전달
            .photoUrl(photoUrl)
            .matchScore(score)
            .build();
    }

    /** (선택) 펫별 매니저 추천 임시 Mock */
    public Page<RecoManagerDto> recommendManagers(Long seniorId, Long petId, Pageable pageable) {
        RecoManagerDto m1 = RecoManagerDto.builder()
            .id(101L).name("케어매니저 A").intro("강아지 산책 전문")
            .matchScore(0.92).photoUrl(null).build();
        RecoManagerDto m2 = RecoManagerDto.builder()
            .id(102L).name("케어매니저 B").intro("고양이 케어 특화")
            .matchScore(0.88).photoUrl(null).build();
        List<RecoManagerDto> list = List.of(m1, m2);
        return new PageImpl<>(list, pageable, list.size());
    }

    /** kindCd 정리: 숫자코드면 null, "[개] 시바견" 접두 제거 */
    private String sanitizeBreedFromKindCd(String kindCd) {
        if (!hasText(kindCd)) return null;
        String v = kindCd.trim();
        if (v.matches("^\\d+$")) return null;                 // 전부 숫자면 코드로 판단 → 표시 생략
        v = v.replaceFirst("^\\[[^\\]]+\\]\\s*", "");         // "[개] " 같은 접두 제거
        return hasText(v) ? v : null;
    }

    private boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
