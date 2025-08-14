package com.matchpet.domain.shelter.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "shelters")
@Getter @Setter
public class Shelter {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true) private String externalId;
  private String name;
  private String tel;
  private String address;
  private String region;
  private BigDecimal lat;
  private BigDecimal lng;

  @CreationTimestamp private LocalDateTime createdAt;
  @UpdateTimestamp  private LocalDateTime updatedAt;
}
