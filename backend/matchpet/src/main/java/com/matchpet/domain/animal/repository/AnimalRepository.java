package com.matchpet.domain.animal.repository;

import com.matchpet.domain.animal.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    Optional<Animal> findByExternalId(String externalId);
    Optional<Animal> findByDesertionNo(String desertionNo);
}
