package com.matchpet.web.admin;

import com.matchpet.domain.animal.service.ExternalAnimalIngestService;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/ingest")
public class IngestController {

  private final ExternalAnimalIngestService service;

  // 단건(한 페이지) 수집
  @PostMapping("/external")
  public Map<String, Object> ingest(
      @RequestParam String region,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "1") int page,          // 1부터 권장
      @RequestParam(defaultValue = "200") int size         // 너무 크면 느려짐
  ) {
    validateRange(from, to);
    size = cap(size, 20, 500); // 20~500 범위로 제한
    int cnt = service.ingest(region, from, to, page, size);
    return Map.of(
        "region", region,
        "from", from,
        "to", to,
        "page", page,
        "size", size,
        "upserted", cnt
    );
  }

  // 여러 페이지 연속 수집(아이템 없을 때까지)
  @PostMapping("/external/all")
  public Map<String, Object> ingestAll(
      @RequestParam String region,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "200") int size
  ) {
    validateRange(from, to);
    size = cap(size, 50, 500);
    int total = service.ingestAll(region, from, to, size);
    return Map.of(
        "region", region,
        "from", from,
        "to", to,
        "size", size,
        "totalUpserted", total
    );
  }

  // ─── 공통 유틸/에러 핸들링 ───

  private void validateRange(LocalDate from, LocalDate to) {
    if (from.isAfter(to)) {
      throw new BadRequest("`from` must be <= `to`");
    }
  }

  private int cap(int v, int min, int max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ExceptionHandler(BadRequest.class)
  public Map<String, Object> badRequest(BadRequest e) {
    return Map.of("error", "bad_request", "message", e.getMessage());
  }

  @Value
  static class BadRequest extends RuntimeException {
    String message;
  }
}
