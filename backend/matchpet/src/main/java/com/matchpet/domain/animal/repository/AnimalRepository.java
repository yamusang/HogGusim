package com.matchpet.domain.animal.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.matchpet.domain.animal.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
  Page<Animal> findByCareNm(String careNm, Pageable pageable);

  // 가입 검증용 (이미 사용 중)
  @Query("""
         select case when count(a) > 0 then true else false end
           from Animal a
          where upper(trim(a.careNm)) = upper(trim(:careNm))
         """)
  boolean existsByCareNmStrict(String careNm);

  @Query("""
         select distinct trim(a.careNm)
           from Animal a
          where a.careNm is not null and trim(a.careNm) <> ''
          order by trim(a.careNm) asc
         """)
  List<String> findDistinctCareNames();
}