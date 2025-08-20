package com.matchpet.domain.application.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.repository.ApplicationRepository;
import com.matchpet.web.dto.ApplicationRow;
import com.matchpet.web.dto.ApplicationUpdateReq;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository appRepo;
    private final AnimalRepository animalRepo;

    public Page<ApplicationRow> findBySenior(Long seniorId, Pageable pageable) {
        return appRepo.findBySeniorIdOrderByCreatedAtDesc(seniorId, pageable)
            .map(this::toRow);
    }

    public Page<ApplicationRow> findByPet(Long animalId, Pageable pageable) {
        return appRepo.findByAnimalIdOrderByCreatedAtDesc(animalId, pageable)
            .map(this::toRow);
    }

    @Transactional
    public ApplicationRow update(Long id, ApplicationUpdateReq req) {
        Application app = appRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("application not found"));

        if (req.getReservedAt() != null) app.setReservedAt(req.getReservedAt());
        if (req.getNote() != null) app.setNote(req.getNote());

        return toRow(app);
    }

    @Transactional
    public ApplicationRow approve(Long id) {
        Application app = appRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("application not found"));
        app.setStatus(Application.Status.APPROVED);

        // 보호소 동물 상태 갱신: MATCHING
        Animal animal = animalRepo.findById(app.getAnimalId())
            .orElseThrow(() -> new IllegalArgumentException("animal not found"));
        animal.setStatus(Animal.Status.MATCHING);

        return toRow(app);
    }

    @Transactional
    public ApplicationRow reject(Long id) {
        Application app = appRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("application not found"));
        app.setStatus(Application.Status.REJECTED);
        return toRow(app);
    }

    private ApplicationRow toRow(Application a) {
        return ApplicationRow.builder()
            .id(a.getId())
            .animalId(a.getAnimalId())
            .animalName(null)               // 필요 시 조인하여 채워도 됨
            .status(a.getStatus().name())
            .createdAt(a.getCreatedAt())
            .reservedAt(a.getReservedAt())
            .note(a.getNote())
            .build();
    }
}
