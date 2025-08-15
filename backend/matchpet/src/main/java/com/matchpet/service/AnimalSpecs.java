package com.matchpet.service;

import com.matchpet.domain.animal.entity.Animal;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;

public class AnimalSpecs {
  public static Specification<Animal> sexEq(String sex) {
    return (root, q, cb) -> sex==null || sex.isBlank() ? null : cb.equal(root.get("sexCd"), sex);
  }
  public static Specification<Animal> stateEq(String state) {
    return (root, q, cb) -> state==null || state.isBlank() ? null : cb.equal(root.get("processState"), state);
  }
  public static Specification<Animal> orgLike(String org) {
    return (root, q, cb) -> org==null || org.isBlank() ? null : cb.like(root.get("orgNm"), "%"+org+"%");
  }
  public static Specification<Animal> dateBetween(LocalDate from, LocalDate to) {
    return (root, q, cb) -> {
      if (from==null && to==null) return null;
      if (from!=null && to!=null) return cb.between(root.get("happenDt"), from, to);
      if (from!=null) return cb.greaterThanOrEqualTo(root.get("happenDt"), from);
      return cb.lessThanOrEqualTo(root.get("happenDt"), to);
    };
  }
}
