package com.matchpet.domain.application.repository;

import com.matchpet.domain.application.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Page<Application> findBySeniorIdOrderByCreatedAtDesc(Long seniorId, Pageable pageable);

    Page<Application> findByAnimalIdOrderByCreatedAtDesc(Long animalId, Pageable pageable);
}
