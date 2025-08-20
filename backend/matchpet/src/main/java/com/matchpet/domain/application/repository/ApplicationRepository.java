package com.matchpet.domain.application.repository;

import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
  Page<Application> findBySeniorUserId(Long seniorUserId, Pageable pageable);

  long countBySeniorUserIdAndAnimalIdAndStatus(Long seniorUserId, Long animalId, ApplicationStatus status);

  @Query("""
    select app
      from Application app
      join com.matchpet.domain.animal.entity.Animal a on a.id = app.animalId
     where (:careNm is null or a.careNm like %:careNm%)
       and (:status is null or app.status = :status)
  """)
  Page<Application> findByShelterAndStatus(@Param("careNm") String careNm,
                                           @Param("status") ApplicationStatus status,
                                           Pageable pageable);
}
