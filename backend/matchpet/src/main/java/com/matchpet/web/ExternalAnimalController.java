package com.matchpet.web;

import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/external")
public class ExternalAnimalController {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    private final AnimalApiClient api;

    /**
     * 외부 API 미리보기(페이징 포함).
     * 예) GET /api/external/animals?from=2025-08-01&to=2025-08-14&region=6260000&pageNo=1&pageSize=10
     */
    @GetMapping("/animals")
    public ResponseEntity<ExternalResponse> preview(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(name = "region", required = false) String uprCd,
            @RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") int pageSize
    ) {
        LocalDate f = parseDateFlexible(from);
        LocalDate t = parseDateFlexible(to);
        ExternalResponse r = api.call(f, t, uprCd, pageNo, pageSize);
        return ResponseEntity.ok(r);
    }

    /** yyyy-MM-dd 또는 yyyyMMdd 둘 다 허용 */
    private static LocalDate parseDateFlexible(String input) {
        String s = input.trim();
        if (s.length() == 8 && s.chars().allMatch(Character::isDigit)) {
            return LocalDate.parse(s, BASIC);
        }
        return LocalDate.parse(s);
    }
}