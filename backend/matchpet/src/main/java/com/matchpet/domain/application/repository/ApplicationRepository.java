package com.matchpet.domain.application.repository;

import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // 연관 엔티티 한 번에 로딩 (N+1 방지)
    @EntityGraph(attributePaths = {"animal", "senior", "manager"})
    Page<Application> findBySeniorId(Long seniorId, Pageable pageable);

    @EntityGraph(attributePaths = {"animal", "senior", "manager"})
    Page<Application> findByAnimalId(Long animalId, Pageable pageable);

    @EntityGraph(attributePaths = {"animal", "senior", "manager"})
    @Query("""
      select a from Application a
       join com.matchpet.domain.animal.entity.Animal an on a.animalId = an.id
      where (:shelterId is null or an.shelterId = :shelterId)
        and (:status    is null or a.status = :status)
    """)
    Page<Application> findByShelterAndStatus(@Param("shelterId") Long shelterId,
                                             @Param("status") ApplicationStatus status,
                                             Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"animal", "senior", "manager"})
    Page<Application> findAll(Pageable pageable);
}
