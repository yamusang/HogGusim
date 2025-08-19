// src/main/java/com/matchpet/domain/match/RecommendationService.java
package com.matchpet.domain.match;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
import com.matchpet.web.dto.RecoManagerDto;
import com.matchpet.web.dto.RecoPetDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final SeniorProfileRepository seniorRepo;   // ✅ 누락 필드 추가
    private final AnimalRepository animalRepo;          // ✅ 이름 통일 (animalRepo)

    /**
     * 시니어별 추천 동물 (임시 로직):
     *  - 사진 있는 개체 우선(점수 가산)
     *  - 최신 등록 우선(정렬로 간접 반영)
     */
    public Page<RecoPetDto> recommendPets(Long seniorId, Pageable pageable) {
        SeniorProfile s = seniorRepo.findById(seniorId).orElseThrow();

        Page<Animal> page = animalRepo.findAll(
                PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "id"))
        );

        List<RecoPetDto> list = page.getContent().stream()  // ✅ getContent().stream()
                .filter(a -> "AVAILABLE".equalsIgnoreCase(Objects.toString(a.getProcessState(), "")))
                .map(this::toRecoPet)                        // ✅ 생성자 대신 매퍼 사용
                .toList();

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    /** Animal → RecoPetDto 매핑 */
    private RecoPetDto toRecoPet(Animal a) {
        double base = 0.6;
        double photoBoost = hasText(a.getPopfile()) ? 0.3 : 0.0;
        double recentBoost = 0.1; // createdAt 정렬로 간접 반영
        double score = Math.min(1.0, base + photoBoost + recentBoost);

        String breed = sanitizeBreedFromKindCd(a.getKindCd());
        String photoUrl = hasText(a.getPopfile()) ? a.getPopfile()
                : hasText(a.getFilename()) ? a.getFilename()
                : null;

        return RecoPetDto.builder()
                .id(a.getId())
                .desertionNo(a.getDesertionNo())
                .name(null)             // Animal에 name 없음
                .breed(breed)
                .age(a.getAge())
                .photoUrl(photoUrl)
                .matchScore(score)
                .build();
    }

    /** 펫별 매니저 추천 (임시 Mock) */
    public Page<RecoManagerDto> recommendManagers(Long seniorId, Long petId, Pageable pageable) {
        // TODO: 실제 매니저 엔티티/리포지토리 연동
        RecoManagerDto m1 = RecoManagerDto.builder()
                .id(101L).name("케어매니저 A").intro("강아지 산책 전문")
                .matchScore(0.92).photoUrl(null).build();
        RecoManagerDto m2 = RecoManagerDto.builder()
                .id(102L).name("케어매니저 B").intro("고양이 케어 특화")
                .matchScore(0.88).photoUrl(null).build();

        List<RecoManagerDto> list = List.of(m1, m2);
        return new PageImpl<>(list, pageable, list.size());
    }

    /** kindCd 정리: 숫자코드면 null, "[개] 시바견" 접두 대괄호 제거 */
    private String sanitizeBreedFromKindCd(String kindCd) {
        if (!hasText(kindCd)) return null;
        String v = kindCd.trim();
        if (v.matches("^\\d+$")) return null;           // 숫자코드 제거
        v = v.replaceFirst("^\\[[^\\]]+\\]\\s*", "");    // [개] 같은 접두 제거
        return hasText(v) ? v : null;
    }

    private boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
