package com.matchpet.web;

import com.matchpet.domain.match.RecommendationService;
import com.matchpet.web.dto.RecoPetDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reco")
public class RecommendationController {

    private final RecommendationService reco;

    // GET /api/reco/pets?seniorId=...&mode=balanced&page=0&size=12
    @GetMapping("/pets")
    public Page<RecoPetDto> recommend(
        @RequestParam Long seniorId,
        @RequestParam(defaultValue = "balanced") String mode,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return reco.recommendPets(seniorId, mode, PageRequest.of(page, size));
    }
}
