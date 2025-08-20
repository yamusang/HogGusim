package com.matchpet.web;

import com.matchpet.domain.application.service.ApplicationService;
import com.matchpet.web.dto.ApplicationRow;
import com.matchpet.web.dto.ApplicationUpdateReq;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService service;

    // 보호소 화면: 동물 기준 신청 목록
    @GetMapping("/by-pet/{animalId}")
    public Page<ApplicationRow> listByPet(
        @PathVariable Long animalId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return service.findByPet(animalId, PageRequest.of(page, size));
    }

    // 시니어 화면: 본인 신청 목록
    @GetMapping("/by-senior/{seniorId}")
    public Page<ApplicationRow> listBySenior(
        @PathVariable Long seniorId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return service.findBySenior(seniorId, PageRequest.of(page, size));
    }

    // 예약일/메모 부분 수정
    @PatchMapping("/{id}")
    public ResponseEntity<ApplicationRow> update(
        @PathVariable Long id,
        @RequestBody ApplicationUpdateReq req
    ) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApplicationRow> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApplicationRow> reject(@PathVariable Long id) {
        return ResponseEntity.ok(service.reject(id));
    }
}
