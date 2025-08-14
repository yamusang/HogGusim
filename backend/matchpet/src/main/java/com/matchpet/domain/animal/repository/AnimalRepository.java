package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * AnimalRepository
 */
public interface AnimalRepository extends
        JpaRepository<Animal, Long>,
        JpaSpecificationExecutor<Animal> {

    Optional<Animal> findByExternalId(String externalId);

    @Override
    @EntityGraph(attributePaths = {"shelter"})
    Page<Animal> findAll(Specification<Animal> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"shelter"})
    Page<Animal> findAll(Pageable pageable);

    // ← 상세 조회용 (N+1 방지)
    @EntityGraph(attributePaths = {"shelter"})
    Optional<Animal> findWithShelterById(Long id);
}
