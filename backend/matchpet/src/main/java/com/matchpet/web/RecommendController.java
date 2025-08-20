package com.matchpet.web;

import com.matchpet.domain.match.RecommendationService;
import com.matchpet.web.dto.RecoPetDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reco")
public class RecommendController {

  private final RecommendationService service;

  @GetMapping("/ping")
  public String ping(){ return "ok"; }

  /** 예: /api/reco/pets?seniorId=1&mode=balanced&page=0&size=12 */
  @GetMapping("/pets")
  public Page<RecoPetDto> pets(
      @RequestParam Long seniorId,
      @RequestParam(defaultValue = "balanced") String mode,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size
  ){
    Pageable pageable = PageRequest.of(page, size);
    RecommendationService.Mode m;
    try { m = RecommendationService.Mode.valueOf(mode); }
    catch (Exception e) { m = RecommendationService.Mode.balanced; }
    return service.recommendPets(seniorId, m, pageable);
  }

  /** 기존 pairs 호출부 호환용(원하면 삭제 가능) */
  @GetMapping("/pairs")
  public Page<RecoPetDto> pairs(
      @RequestParam Long seniorId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    Pageable pageable = PageRequest.of(page, size);
    return service.recommendPets(seniorId, pageable);
  }
}
