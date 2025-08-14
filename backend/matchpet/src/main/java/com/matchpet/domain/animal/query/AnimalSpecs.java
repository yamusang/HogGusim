package com.matchpet.domain.animal.query;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.enums.AnimalStatus;
import com.matchpet.domain.animal.enums.NeuterStatus;
import com.matchpet.domain.animal.enums.Sex;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AnimalSpecs {

  // ← 컨트롤러에서 부르는 10개 파라미터 버전
  public static Specification<Animal> filter(
      String region,
      AnimalStatus status,
      Sex sex,
      String species,
      String breed,
      Integer ageMin,
      Integer ageMax,
      NeuterStatus neuterStatus,
      Long shelterId,
      String q
  ) {
    return (root, query, cb) -> {
      List<Predicate> p = new ArrayList<>();

      if (region != null && !region.isBlank()) {
        p.add(cb.equal(root.get("region"), region));
      }
      if (status != null) {
        p.add(cb.equal(root.get("status"), status));
      }
      if (sex != null) {
        p.add(cb.equal(root.get("sex"), sex));
      }
      if (species != null && !species.isBlank()) {
        p.add(cb.equal(root.get("species"), species));
      }
      if (breed != null && !breed.isBlank()) {
        p.add(cb.equal(root.get("breed"), breed));
      }
      if (ageMin != null) {
        p.add(cb.greaterThanOrEqualTo(root.get("ageMonths"), ageMin));
      }
      if (ageMax != null) {
        p.add(cb.lessThanOrEqualTo(root.get("ageMonths"), ageMax));
      }
      if (neuterStatus != null) {
        p.add(cb.equal(root.get("neuterStatus"), neuterStatus));
      }
      if (shelterId != null) {
        p.add(cb.equal(root.get("shelter").get("id"), shelterId));
      }
      if (q != null && !q.isBlank()) {
        String like = "%" + q.toLowerCase() + "%";
        var nameLike = cb.like(cb.lower(root.get("name")), like);
        var breedLike = cb.like(cb.lower(root.get("breed")), like);
        // description 필드명이 note라면 아래 한 줄을 note로 바꿔줘.
        var noteLike  = cb.like(cb.lower(root.get("description")), like);
        p.add(cb.or(nameLike, breedLike, noteLike));
      }

      return cb.and(p.toArray(new Predicate[0]));
    };
  }
}
