package com.matchpet.web;

import com.matchpet.domain.match.RecommendationService;
import com.matchpet.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reco")
public class RecommendController {

  private final RecommendationService service;

  @GetMapping("/pets")
  public Page<PetRecoDto> pets(@RequestParam Long seniorId,
                               @PageableDefault(size=20, sort="id", direction=Sort.Direction.DESC) Pageable pageable){
    return service.recommendPets(seniorId, pageable);
  }

  @GetMapping("/managers")
  public Page<ManagerRecoDto> managers(@RequestParam Long seniorId,
                                       @RequestParam Long animalId,
                                       @PageableDefault(size=10) Pageable pageable){
    return service.recommendManagers(seniorId, animalId, pageable);
  }

  @GetMapping("/pairs")
  public Page<PairSuggestionDto> pairs(@RequestParam Long seniorId,
                                       @PageableDefault(size=10) Pageable pageable){
    return service.recommendPairs(seniorId, pageable);
  }
}
