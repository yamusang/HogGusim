package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalCardDto;
import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.enums.AnimalStatus;
import com.matchpet.domain.animal.enums.NeuterStatus;
import com.matchpet.domain.animal.enums.Sex;
import com.matchpet.domain.animal.query.AnimalSpecs;
import com.matchpet.domain.animal.repository.AnimalRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class AnimalController {

  private final AnimalRepository repo;

  /** 목록 조회: /api/animals?... */
  @GetMapping("/animals")
  public Page<AnimalCardDto> list(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) String status,     // AVAILABLE/PENDING/MATCHED/ADOPTED
      @RequestParam(required = false) String sex,        // MALE/FEMALE/UNKNOWN
      @RequestParam(required = false) String species,
      @RequestParam(required = false) String breed,
      @RequestParam(required = false) Integer ageMin,    // 개월 단위
      @RequestParam(required = false) Integer ageMax,
      @RequestParam(required = false) String neuter,     // SPAYED/NEUTERED/UNKNOWN
      @RequestParam(required = false) Long shelterId,    // 보호소 필터
      @RequestParam(required = false) String q,          // 키워드(name/breed/note)
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
  ) {
    AnimalStatus st = safeEnum(status, AnimalStatus.class);
    Sex sx = safeEnum(sex, Sex.class);
    NeuterStatus ns = safeEnum(neuter, NeuterStatus.class);

    var spec = AnimalSpecs.filter(region, st, sx, species, breed, ageMin, ageMax, ns, shelterId, q);
    return repo.findAll(spec, pageable).map(AnimalMapper::toCard);
  }

  /** 상세 조회: /api/animals/{id} */
  @GetMapping("/animals/{id}")
  public AnimalCardDto detail(@PathVariable Long id) {
    Animal a = repo.findWithShelterById(id)
        .orElseThrow(() -> new EntityNotFoundException("Animal not found: " + id));
    return AnimalMapper.toCard(a);
  }

  private static <E extends Enum<E>> E safeEnum(String v, Class<E> type) {
    if (v == null || v.isBlank()) return null;
    try {
      return Enum.valueOf(type, v.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      return null; // 잘못된 값이면 필터 미적용
    }
  }
}
