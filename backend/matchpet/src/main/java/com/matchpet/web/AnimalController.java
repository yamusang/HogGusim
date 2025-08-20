package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {

    private final AnimalRepository repo;

    // 탐색/대시보드 리스트
    @GetMapping
    public Page<CardDto> list(
        @RequestParam(required = false) String careNm,
        @RequestParam(required = false) String status, // AVAILABLE 등 (서비스 status)
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(required = false) String sort
    ) {
        Pageable pageable = PageRequest.of(page, size,
                sort != null ? Sort.by(Sort.Order.desc(sort)) : Sort.by(Sort.Order.desc("id")));

        Page<Animal> result;
        if (careNm != null && status != null) {
            result = repo.findByCareNmContainingIgnoreCaseAndStatus(
                careNm, Animal.Status.valueOf(status), pageable);
        } else if (careNm != null) {
            result = repo.findByCareNmContainingIgnoreCase(careNm, pageable);
        } else {
            result = repo.findAll(pageable);
        }
        return result.map(AnimalMapper::toCard);
    }
}
