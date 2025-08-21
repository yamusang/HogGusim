package com.matchpet.domain.match;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.senior.repository.SeniorRepository;
import com.matchpet.web.dto.RecoPetDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final SeniorRepository seniorRepo;
    private final AnimalRepository animalRepo;

    /**
     * 간단 스코어: AVAILABLE +30, neuter=Y +5
     * page 정렬은 최신 id DESC, 프론트에서 score로 재정렬 가능
     */
    public Page<RecoPetDto> recommendPets(Long seniorId, String mode, Pageable pageable) {
        // senior 정보 필요 시 활용용 조회(가중치 확장 여지)
        seniorRepo.findById(seniorId).orElse(null);

        Page<Animal> base = animalRepo.findAll(
            PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "id"))
        );

        List<RecoPetDto> content = base.stream().map(a -> {
            double score = 0.0;
            boolean available =
                a.getStatus() == Animal.Status.AVAILABLE ||
                (a.getProcessState() != null && a.getProcessState().contains("보호"));

            if (available) score += 30;
            if ("Y".equalsIgnoreCase(a.getNeuterYn())) score += 5;

            String reason = "안전도 " + (available?"+30":"0") +
                            " · 중성화" + ("Y".equalsIgnoreCase(a.getNeuterYn())?"+5":"0");

            return AnimalMapper.toReco(a, score, reason);
        }).toList();

        return new PageImpl<>(content, pageable, base.getTotalElements());
    }
}
