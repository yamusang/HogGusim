package com.matchpet.domain.match;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.manager.entity.ManagerProfile;
import com.matchpet.domain.manager.repository.ManagerProfileRepository;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
import com.matchpet.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService {

  private final SeniorProfileRepository seniorRepo;
  private final AnimalRepository animalRepo;
  private final ManagerProfileRepository managerRepo;

  public Page<PetRecoDto> recommendPets(Long seniorId, Pageable pageable){
    SeniorProfile s = seniorRepo.findById(seniorId).orElseThrow();

    // status = 'AVAILABLE'만 대상 (문자열 비교)
    Page<Animal> page = animalRepo.findAll(PageRequest.of(
        pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "id"))
    );

    List<PetRecoDto> scored = page.stream()
      .filter(a -> "AVAILABLE".equalsIgnoreCase(a.getStatus()) || a.getStatus()==null) // null은 임시 허용
      .map(p -> {
        double score = ScoringUtil.petScore(
          s.getMobilityLevel(), s.getPreferredVisitStyle(), s.getTechComfort(),
          p.getEnergyLevel(), p.getTemperament(), p.isDeviceRequired()
        );
        return PetRecoDto.from(p, score);
      })
      .sorted(Comparator.comparingDouble(PetRecoDto::matchScore).reversed())
      .toList();

    return new PageImpl<>(scored, pageable, page.getTotalElements());
  }

  public Page<ManagerRecoDto> recommendManagers(Long seniorId, Long animalId, Pageable pageable){
    SeniorProfile s = seniorRepo.findById(seniorId).orElseThrow();
    Animal p = animalRepo.findById(animalId).orElseThrow();

    Set<String> required = ScoringUtil.inferRequiredTags(p);
    Page<ManagerProfile> page = managerRepo.findAll(pageable);

    List<ManagerRecoDto> scored = page.stream().map(m -> {
      double skl = ScoringUtil.skillMatch(required, ScoringUtil.parseManagerTags(m.getAnimalSkillTags()));
      double ms  = ScoringUtil.managerScore(s.getMobilityLevel(), m.getElderlyExpLevel(), m.getReliabilityScore(), skl);
      return ManagerRecoDto.from(m, ms);
    }).sorted(Comparator.comparingDouble(ManagerRecoDto::matchScoreManager).reversed())
      .toList();

    return new PageImpl<>(scored, pageable, page.getTotalElements());
  }

  public Page<PairSuggestionDto> recommendPairs(Long seniorId, Pageable pageable){
    SeniorProfile s = seniorRepo.findById(seniorId).orElseThrow();

    Page<Animal> petsPage = animalRepo.findAll(PageRequest.of(
        pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "id"))
    );
    List<ManagerProfile> managers = managerRepo.findAll();

    List<PairSuggestionDto> out = new ArrayList<>();

    for (Animal pet : petsPage.getContent()){
      if (pet.getStatus()!=null && !pet.getStatus().equalsIgnoreCase("AVAILABLE")) continue;

      double pScore = ScoringUtil.petScore(
        s.getMobilityLevel(), s.getPreferredVisitStyle(), s.getTechComfort(),
        pet.getEnergyLevel(), pet.getTemperament(), pet.isDeviceRequired()
      );
      PetRecoDto petDto = PetRecoDto.from(pet, pScore);

      Set<String> required = ScoringUtil.inferRequiredTags(pet);

      ManagerRecoDto best = null;
      double bestTotal = -1;

      for (ManagerProfile m : managers){
        double skl = ScoringUtil.skillMatch(required, ScoringUtil.parseManagerTags(m.getAnimalSkillTags()));
        double mScore = ScoringUtil.managerScore(s.getMobilityLevel(), m.getElderlyExpLevel(), m.getReliabilityScore(), skl);
        double total = 0.7 * pScore + 0.3 * mScore;

        if (total > bestTotal){
          bestTotal = total;
          best = ManagerRecoDto.from(m, mScore);
        }
      }

      if (best != null){
        out.add(new PairSuggestionDto(petDto, best, Math.min(100.0, bestTotal)));
      }
    }

    out.sort(Comparator.comparingDouble(PairSuggestionDto::totalScore).reversed());
    return new PageImpl<>(
      out.subList(0, Math.min(out.size(), pageable.getPageSize())),
      pageable, out.size()
    );
  }
}
