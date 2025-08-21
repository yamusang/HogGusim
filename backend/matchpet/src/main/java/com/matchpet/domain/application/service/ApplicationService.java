package com.matchpet.domain.application.service;

import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.application.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository repo;

    /**
     * petId(null 허용): null이면 추천 대기 상태(AWAITING_MATCH)로 저장, 아니면 PENDING
     */
    @Transactional
    public Application create(Long seniorId, Long animalId, String note) {
        if (seniorId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No seniorId");
        }

        Application a = Application.builder()
                .seniorId(seniorId)
                .animalId(animalId) // DB 컬럼명이 animal_id 라면 그대로 사용
                .note(note)
                .status(animalId == null
                        ? ApplicationStatus.AWAITING_MATCH   // ⭐️ 동물 미지정 → 추천 대기
                        : ApplicationStatus.PENDING)         // 동물 선택 → 심사 대기(매니저)
                .build();

        return repo.save(a);
    }

    @Transactional
    public Application approve(Long id) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setStatus(ApplicationStatus.APPROVED);
        return a;
    }

    @Transactional
    public Application reject(Long id) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setStatus(ApplicationStatus.REJECTED);
        return a;
    }

    @Transactional
    public Application cancel(Long id) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setStatus(ApplicationStatus.CANCELED);
        return a;
    }

    /**
     * 추천 화면에서 동물 선택 완료 시: pet 연결 + 상태를 심사 대기(PENDING)로
     */
    @Transactional
    public Application attachPetAndActivate(Long id, Long animalId) {
        if (animalId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "petId is required");
        }
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setAnimalId(animalId);
        a.setStatus(ApplicationStatus.PENDING);
        return a;
    }

    // -------------------- 2단계: 매니저 승인/거절 + 보호소 전달 --------------------

    /** 매니저 승인(선택적으로 managerId 기록) */
    @Transactional
    public Application managerApprove(Long id, Long managerId) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        if (managerId != null) a.setManagerId(managerId);
        a.setStatus(ApplicationStatus.MANAGER_APPROVED);
        return a;
    }

    /** 매니저 거절 */
    @Transactional
    public Application managerReject(Long id) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setStatus(ApplicationStatus.MANAGER_REJECTED);
        return a;
    }

    /** 보호소로 전달 */
    @Transactional
    public Application forwardToShelter(Long id) {
        Application a = repo.findById(id).orElseThrow(() -> notFound(id));
        a.setStatus(ApplicationStatus.FORWARDED);
        return a;
    }

    // ------------------------------------------------------------------------

    /**
     * 소유자(해당 신청의 seniorId) 또는 특정 권한이면 통과, 아니면 403
     */
    @Transactional(readOnly = true)
    public void assertOwnerOrRoles(Long appId, Long meUserId, Set<String> allowedRoles) {
        if (meUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Application a = repo.findById(appId).orElseThrow(() -> notFound(appId));

        // 소유자면 통과
        if (a.getSeniorId() != null && a.getSeniorId().equals(meUserId))
            return;

        // 권한 체크는 SecurityContext 사용
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            boolean ok = auth.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .anyMatch(allowedRoles::contains);
            if (ok)
                return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    public org.springframework.data.domain.Page<Application> list(
            Long seniorId, Long animalId, Long shelterId,
            ApplicationStatus status, org.springframework.data.domain.Pageable pageable) {
        if (seniorId != null)
            return repo.findBySeniorId(seniorId, pageable);
        if (animalId != null)
            return repo.findByAnimalId(animalId, pageable);
        if (shelterId != null || status != null)
            return repo.findByShelterAndStatus(shelterId, status, pageable);
        return repo.findAll(pageable);
    }

    public Application get(Long id) {
        return repo.findById(id).orElseThrow(() -> notFound(id));
    }

    private static ResponseStatusException notFound(Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Application " + id + " not found");
    }
}
