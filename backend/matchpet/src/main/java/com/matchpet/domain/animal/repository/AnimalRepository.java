// src/main/java/com/matchpet/domain/animal/repository/AnimalRepository.java
package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;

import java.util.Optional;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

  @Query("""
        select a from Animal a
        where (:careNm is null or trim(:careNm) = '' or a.careNm = :careNm)
          and (coalesce(a.processState, '') = '' or a.processState = 'AVAILABLE')
      """)
  Page<Animal> findAvailableByCareNm(@Param("careNm") String careNm, Pageable pageable);

  @Query("""
        select a from Animal a
        where (coalesce(a.processState, '') = '' or a.processState = 'AVAILABLE')
          and a.popfile is not null and a.popfile <> ''
      """)
  Page<Animal> findAvailableWithPhoto(Pageable pageable);

  Optional<Animal> findByExternalId(String externalId);

  Optional<Animal> findByDesertionNo(String desertionNo);
}
