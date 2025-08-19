package com.matchpet.domain.shelter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shelters",
  uniqueConstraints = @UniqueConstraint(name="uq_shelter_name_addr", columnNames={"care_nm","care_addr"}))
@Getter @Setter
public class Shelter {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "shelter_id")
  private Long id;

  @Column(name = "care_nm",  nullable = false, length = 120) private String name;
  @Column(name = "care_tel", length = 40)                     private String tel;
  @Column(name = "care_addr",nullable = false, length = 255)  private String address;
  @Column(name = "lat", precision = 10, scale = 7)            private BigDecimal lat;
  @Column(name = "lng", precision = 10, scale = 7)            private BigDecimal lng;
  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "external_id", unique = true, length = 64)
  private String externalId; // DB 없음 → 비영속
  @Transient private String region;     // DB 없음 → 비영속
}

