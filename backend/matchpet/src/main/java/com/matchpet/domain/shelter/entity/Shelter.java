package com.matchpet.domain.shelter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "shelters",
    uniqueConstraints = @UniqueConstraint(name = "uq_shelter_external_id", columnNames = {"external_id"}))
@Getter @Setter
public class Shelter {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** 외부 보호소 식별자(있으면) */
  @Column(name = "external_id", length = 64)
  private String externalId;

  // ExternalAnimalIngestService에서 사용하는 필드
  private String name;     // s.setName(...)
  private String tel;      // s.setTel(...)
  private String address;  // s.setAddress(...)
  private String region;   // s.setRegion(...)
  private BigDecimal lat;  // s.setLat(...)
  private BigDecimal lng;  // s.setLng(...)
}
