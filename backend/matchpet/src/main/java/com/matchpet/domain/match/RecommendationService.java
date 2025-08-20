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
     * 간단한 버전: 부산 보호중 후보 중 서비스 status=AVAILABLE 우선, 점수는 임시(정렬 가중치)
     * mode: conservative/balanced/manager (노출 제한은 컨트롤러에서 page/filter로 처리)
     */
    public Page<RecoPetDto> recommendPets(Long seniorId, String mode, Pageable pageable) {
        // 시니어 프로필 조회 (추후 선호도/시간대 가중치에 활용)
        seniorRepo.findById(seniorId).orElse(null);

        // 기본 후보: 최근 등록순
        Page<Animal> base = animalRepo.findAll(
            PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "id"))
        );

        // 점수 계산(아주 간단한 예시): AVAILABLE=+30, neuter=Y +5
        List<RecoPetDto> scored = base.stream().map(a -> {
            double score = 0.0;
            if (a.getStatus() == Animal.Status.AVAILABLE) score += 30;
            if ("Y".equalsIgnoreCase(a.getNeuter())) score += 5;
            String reason = "안전도 " + (a.getStatus()==Animal.Status.AVAILABLE?"+30":"0")
                + " · 중성화" + ("Y".equalsIgnoreCase(a.getNeuter())?"+5":"0");
            return AnimalMapper.toReco(a, score, reason);
        }).toList();

        return new PageImpl<>(scored, pageable, base.getTotalElements());
    }
}
