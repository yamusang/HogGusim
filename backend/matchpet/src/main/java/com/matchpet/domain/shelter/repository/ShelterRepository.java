package com.matchpet.domain.shelter.repository;

import com.matchpet.domain.shelter.entity.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {
  Optional<Shelter> findByExternalId(String externalId);

  // AnimalIngestService(공공데이터 원문)에서 이름/주소 기반으로도 찾고 싶다면:
  Optional<Shelter> findByNameAndAddress(String name, String address);
}
