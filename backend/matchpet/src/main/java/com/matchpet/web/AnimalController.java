package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {

    private final AnimalRepository repo;

    /** 페이지네이션 리스트 (spec 없이 단순 페이지 조회) */
    @GetMapping
    public Page<CardDto> list(Pageable pageable) {
        return repo.findAll(pageable).map(AnimalMapper::toCard);
    }

    /** 단건 조회 */
    @GetMapping("/{id}")
    public CardDto get(@PathVariable Long id) {
        Animal a = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Animal not found: " + id));
        return AnimalMapper.toCard(a);
    }
}
