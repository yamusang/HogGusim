package com.matchpet.domain.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.application.repository.ApplicationRepository;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository repo;

    @Transactional
    public Application create(Long seniorId, Long animalId, String note) {
        Application a = Application.builder()
                .seniorId(seniorId)
                .animalId(animalId)
                .note(note)
                .status(ApplicationStatus.PENDING)
                .build();
        return repo.save(a);
    }

    @Transactional public Application approve(Long id) { var a = repo.findById(id).orElseThrow(); a.setStatus(ApplicationStatus.APPROVED); return a; }
    @Transactional public Application reject (Long id) { var a = repo.findById(id).orElseThrow(); a.setStatus(ApplicationStatus.REJECTED); return a; }
    @Transactional public Application cancel (Long id) { var a = repo.findById(id).orElseThrow(); a.setStatus(ApplicationStatus.CANCELED); return a; }

    public Page<Application> list(Long seniorId, Long animalId, Long shelterId,
                                  ApplicationStatus status, Pageable pageable) {
        if (seniorId != null) return repo.findBySeniorId(seniorId, pageable);
        if (animalId != null) return repo.findByAnimalId(animalId, pageable);
        if (shelterId != null || status != null)
            return repo.findByShelterAndStatus(shelterId, status, pageable);
        return repo.findAll(pageable);
    }

    public Application get(Long id) { return repo.findById(id).orElseThrow(); }
}
