package com.matchpet.web;

import com.matchpet.domain.animal.repository.AnimalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 보호소 드롭다운용 단순 목록 API
 * GET /api/shelters/care-names  -> ["부산유기동물보호소", "OO구동물보호센터", ...]
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/shelters")
public class ShelterController {

    private final AnimalRepository animalRepository;

    @GetMapping("/care-names")
    public List<String> careNames() {
        // null/빈 문자열 제외 + 정렬
        return animalRepository.findDistinctCareNames();
    }
}
// 