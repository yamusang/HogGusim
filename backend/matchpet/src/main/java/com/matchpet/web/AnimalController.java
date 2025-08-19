package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {
  private final AnimalRepository repo;

  @GetMapping
  public Page<CardDto> list(
      @RequestParam(required = false) String careNm,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String sort // 무시 or 사용
  ) {
    Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")); // ★ 안전 기본
    if (careNm != null && !careNm.isBlank()) {
      String normalized = careNm.trim().replaceAll("\\s+", " ");
      return repo.findByCareNmContainingIgnoreCase(normalized, p)
           .map(AnimalMapper::toCard);
    }
    return repo.findAll(p).map(AnimalMapper::toCard);
  }

  @GetMapping("/{id}")
  public CardDto get(@PathVariable Long id) {
    Animal a = repo.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Animal not found: " + id));
    return AnimalMapper.toCard(a);
  }

  @GetMapping("/care-names")
  public List<String> careNames() {
    return repo.findDistinctCareNames();
  }
}
