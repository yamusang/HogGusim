// src/main/java/com/matchpet/domain/stats/repository/RescueStatRepository.java
package com.matchpet.domain.stats.repository;

import com.matchpet.domain.stats.entity.RescueStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RescueStatRepository extends JpaRepository<RescueStat, Long> {
    Optional<RescueStat> findByItemHash(String itemHash);
}
