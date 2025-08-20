package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

    // 보호소명 부분검색
    Page<Animal> findByCareNmContainingIgnoreCase(String careNm, Pageable pageable);

    // 보호소명 + 서비스 상태
    Page<Animal> findByCareNmContainingIgnoreCaseAndStatus(String careNm, Animal.Status status, Pageable pageable);

    Optional<Animal> findByExternalId(String externalId);
    Optional<Animal> findByDesertionNo(String desertionNo);

    // ⭐ AuthService에서 사용
    boolean existsByCareNm(String careNm);

    // ⭐ ShelterController에서 사용
    @Query("select distinct a.careNm from Animal a " +
           "where a.careNm is not null and a.careNm <> '' " +
           "order by a.careNm asc")
    List<String> findDistinctCareNames();

}
