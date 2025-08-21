package com.matchpet.web;

import com.matchpet.domain.application.service.ApplicationService;
import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.mapper.ApplicationMapper;
import com.matchpet.web.dto.ApplicationCreateRequest;
import com.matchpet.web.dto.ApplicationRow;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService service;

    // ---- 기존 목록 (쿼리 파라미터 버전)
    @GetMapping
    public Page<ApplicationRow> list(
            @RequestParam(required = false) Long seniorId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long shelterId,
            @RequestParam(required = false) ApplicationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(seniorId, animalId, shelterId, status, pageable)
                .map(ApplicationMapper::row);
    }

    // ---- 경로 기반: /by-senior/{seniorId}
    @GetMapping("/by-senior/{seniorId}")
    public Page<ApplicationRow> bySenior(
            @PathVariable Long seniorId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication auth) {
        // 내 것만 조회 허용 (또는 SHELTER/ADMIN)
        if (!isSelfOrRoles(auth, seniorId, Set.of("ROLE_SHELTER", "ROLE_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        return service.list(seniorId, null, null, null, pageable)
                .map(ApplicationMapper::row);
    }

    // ---- (선택) 보호소 경로도 쓰면 열어두기: /by-shelter/{shelterId}
    @GetMapping("/by-shelter/{shelterId}")
    public Page<ApplicationRow> byShelter(
            @PathVariable Long shelterId,
            @RequestParam(required = false) ApplicationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(null, null, shelterId, status, pageable)
                .map(ApplicationMapper::row);
    }

    @GetMapping("/{id}")
    public ApplicationRow getOne(@PathVariable Long id) {
        Application a = service.get(id);
        return ApplicationMapper.row(a);
    }

    @PostMapping
    public ApplicationRow create(@RequestBody ApplicationCreateRequest req,
                                 Authentication auth,
                                 @RequestHeader(value = "X-MOCK-SENIOR-ID", required = false) Long mockSeniorId) {
        Long seniorId = mockSeniorId != null ? mockSeniorId : parsePrincipalAsLong(auth);
        if (seniorId == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No seniorId");

        Application saved = service.create(seniorId, req.getPetId(), req.getNote());
        return ApplicationMapper.row(saved);
    }

    @PostMapping("/{id}/approve")
    public ApplicationRow approve(@PathVariable Long id) {
        return ApplicationMapper.row(service.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ApplicationRow reject(@PathVariable Long id) {
        return ApplicationMapper.row(service.reject(id));
    }

    @PostMapping("/{id}/cancel")
    public ApplicationRow cancel(@PathVariable Long id) {
        return ApplicationMapper.row(service.cancel(id));
    }

    @PostMapping("/{id}/select-pet")
    public ApplicationRow selectPet(@PathVariable Long id,
                                    @RequestParam Long petId,
                                    Authentication auth) {
        // 본인 신청만 변경 가능 (또는 SHELTER/ADMIN 허용)
        Long me = parsePrincipalAsLong(auth);
        service.assertOwnerOrRoles(id, me, Set.of("ROLE_SHELTER", "ROLE_ADMIN"));

        Application updated = service.attachPetAndActivate(id, petId);
        return ApplicationMapper.row(updated);
    }

    // -------------------- 2단계: 매니저 승인/거절 + 보호소 전달 --------------------

    @PostMapping("/{id}/manager-approve")
    public ApplicationRow managerApprove(@PathVariable Long id,
                                         @RequestBody(required = false) java.util.Map<String,Object> body) {
        Long managerId = null;
        if (body != null && body.get("managerId") != null) {
            managerId = ((Number) body.get("managerId")).longValue();
        }
        return ApplicationMapper.row(service.managerApprove(id, managerId));
    }

    @PostMapping("/{id}/manager-reject")
    public ApplicationRow managerReject(@PathVariable Long id) {
        return ApplicationMapper.row(service.managerReject(id));
    }

    @PostMapping("/{id}/forward-to-shelter")
    public ApplicationRow forwardToShelter(@PathVariable Long id) {
        return ApplicationMapper.row(service.forwardToShelter(id));
    }

    // ------------------------------------------------------------------------

    // ---- helpers
    private static Long parsePrincipalAsLong(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null)
            return null;
        try {
            return Long.valueOf(auth.getPrincipal().toString());
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean isSelfOrRoles(Authentication auth, Long seniorId, Set<String> roles) {
        Long me = parsePrincipalAsLong(auth);
        if (me != null && me.equals(seniorId))
            return true;
        if (auth == null)
            return false;
        var my = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
        return my.stream().anyMatch(roles::contains);
    }
}
