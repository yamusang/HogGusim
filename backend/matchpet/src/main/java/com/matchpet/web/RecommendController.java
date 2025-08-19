// src/main/java/com/matchpet/web/RecommendController.java
package com.matchpet.web;

import com.matchpet.domain.match.RecommendationService;
import com.matchpet.web.dto.RecoPetDto;
import com.matchpet.web.dto.RecoManagerDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reco")
public class RecommendController {

    private final RecommendationService recommendationService;

    /** 시니어별 추천 동물 */
    @GetMapping("/pets")
    public Page<RecoPetDto> recommendPets(
            @RequestParam Long seniorId,
            @RequestParam(required = false) String careNm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return recommendationService.recommendPets(seniorId, careNm, pageable);
    }

    /** 펫별 추천 매니저 */
    @GetMapping("/managers")
    public Page<RecoManagerDto> recommendManagers(
            @RequestParam Long seniorId,
            @RequestParam Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return recommendationService.recommendManagers(seniorId, petId, pageable);
    }
}
