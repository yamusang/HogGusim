package com.matchpet.web;

import com.matchpet.domain.match.RecommendationService;
import com.matchpet.web.dto.RecoPetDto;
import com.matchpet.web.dto.RecoManagerDto;
// import com.matchpet.web.dto.PairSuggestionDto; // 페어링 서비스 준비되면 사용
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

    /** 동물 추천 */
    @GetMapping("/pets")
    public Page<RecoPetDto> pets(
            @RequestParam Long seniorId,
            @RequestParam(required = false) String careNm, // 현재 서비스에서 미사용 (필터 필요 시 서비스 오버로드 추가)
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        // 현재 시그니처: recommendPets(Long seniorId, Pageable pageable)
        return service.recommendPets(seniorId, pageable);
    }

    /** 매니저 추천 */
    @GetMapping("/managers")
    public Page<RecoManagerDto> managers(
            @RequestParam Long seniorId,
            @RequestParam Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return service.recommendManagers(seniorId, petId, pageable);
    }

    /**
     * 매칭쌍 추천 (임시)
     * - 실제 PairSuggestionDto로 묶는 서비스가 준비되기 전까지 펫 추천을 반환하여 컴파일 오류 제거
     * - 준비되면 리턴 타입/호출부를 PairSuggestionDto용으로 교체
     */
    @GetMapping("/pairs")
    public Page<RecoPetDto> pairs( // 임시로 RecoPetDto로 맞춤
            @RequestParam Long seniorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return service.recommendPets(seniorId, pageable);
    }
}
