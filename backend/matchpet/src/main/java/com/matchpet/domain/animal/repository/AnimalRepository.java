// src/main/java/com/matchpet/domain/animal/repository/AnimalRepository.java
package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

       // "보호소명 정확 일치 존재 여부"
       boolean existsByCareNm(String careNm);

       // "보호소명 부분 일치 (대소문자 무시) + 페이징"
       Page<Animal> findByCareNmContainingIgnoreCase(String careNm, Pageable pageable);

       // "보호소명 distinct 목록"
       @Query("select distinct a.careNm from Animal a " +
                     "where a.careNm is not null and a.careNm <> '' " +
                     "order by a.careNm asc")
       List<String> findDistinctCareNames();

       Optional<Animal> findByExternalId(String externalId);

       Optional<Animal> findByDesertionNo(String desertionNo);

       @Query("""
                     select a
                       from Animal a
                      where a.processState = '보호중'
                        and a.careAddr like '부산광역시%'
                     """)
       Page<Animal> findAvailableInBusan(Pageable pageable);

       @Query("""
                       select a from Animal a
                        where (:careNm is null or a.careNm like %:careNm%)
                          and (:onlyProtected = false or a.processState = '보호중')
                     """)
       Page<Animal> findList(@org.springframework.data.repository.query.Param("careNm") String careNm,
                     @org.springframework.data.repository.query.Param("onlyProtected") boolean onlyProtected,
                     Pageable pageable);
}
