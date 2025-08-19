package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {

    private final AnimalRepository repo;

    /** 페이지네이션 리스트 (careNm 있으면 보호소별 필터) */
    @GetMapping
    public Page<CardDto> list(
            @RequestParam(required = false) String careNm,
            Pageable pageable) {

        if (careNm != null && !careNm.isBlank()) {
            String normalized = careNm.trim().replaceAll("\\s+", " ");
            return repo.findByCareNm(normalized, pageable).map(AnimalMapper::toCard);
        }
        return repo.findAll(pageable).map(AnimalMapper::toCard);
    }

    /** 단건 조회 */
    @GetMapping("/{id}")
    public CardDto get(@PathVariable Long id) {
        Animal a = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Animal not found: " + id));
        return AnimalMapper.toCard(a);
    }

    /** 보호소명 드롭다운용: DISTINCT care_nm 리스트 */
    @GetMapping("/care-names")
    public List<String> careNames() {
        return repo.findDistinctCareNames();
    }
}
