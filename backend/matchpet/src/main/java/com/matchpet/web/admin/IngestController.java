package com.matchpet.web.admin;

import com.matchpet.domain.animal.service.ExternalAnimalIngestService;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/internal/ingest")
public class IngestController {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    private final ExternalAnimalIngestService ingestService;

    @PostMapping("/animals")
    public ResponseEntity<Result> ingest(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(name = "region", required = false) String uprCd,
            @RequestParam(name = "pageSize", defaultValue = "500") int pageSize
    ) {
        LocalDate f = parseDateFlexible(from);
        LocalDate t = parseDateFlexible(to);
        if (uprCd == null || uprCd.isBlank()) uprCd = "6260000"; // 기본: 부산광역시

        var c = ingestService.ingest(f, t, uprCd, Math.min(pageSize, 1000));
        return ResponseEntity.ok(new Result("OK", "total=%d, inserted=%d, updated=%d".formatted(
                c.getTotal(), c.getInserted(), c.getUpdated()
        )));
    }

    private static LocalDate parseDateFlexible(String input) {
        String s = input.trim();
        if (s.length() == 8 && s.chars().allMatch(Character::isDigit)) {
            return LocalDate.parse(s, BASIC);
        }
        return LocalDate.parse(s);
    }

    @Value
    public static class Result {
        String status;
        String message;
    }
}