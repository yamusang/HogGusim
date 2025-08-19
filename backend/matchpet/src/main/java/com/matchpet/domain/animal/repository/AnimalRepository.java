package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    Optional<Animal> findByExternalId(String externalId);
    Optional<Animal> findByDesertionNo(String desertionNo);
    Page<Animal> findByCareNm(String careNm, Pageable pageable);

    // 보호소명 존재 검증 (대소문자/공백 무시한 정확 일치)
    @Query("""
           select case when count(a) > 0 then true else false end
             from Animal a
            where upper(trim(a.careNm)) = upper(trim(:careNm))
           """)
    boolean existsByCareNmStrict(String careNm);

    // 드롭다운용 distinct 보호소명 (정렬 + 빈값 제거)
    @Query("""
           select distinct trim(a.careNm)
             from Animal a
            where a.careNm is not null
              and trim(a.careNm) <> ''
            order by trim(a.careNm) asc
           """)
    List<String> findDistinctCareNames();
}
// 