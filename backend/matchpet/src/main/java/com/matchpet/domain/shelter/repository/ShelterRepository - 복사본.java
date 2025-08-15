package com.matchpet.domain.shelter.repository;

import com.matchpet.domain.shelter.entity.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {
  Optional<Shelter> findByExternalId(String externalId);
}
