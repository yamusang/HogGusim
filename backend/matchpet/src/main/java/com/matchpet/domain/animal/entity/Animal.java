package com.matchpet.domain.animal.entity;

import com.matchpet.domain.animal.enums.*;
import com.matchpet.domain.shelter.entity.Shelter;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "animals")
@Getter @Setter
public class Animal {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true) private String externalId;

  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "shelter_id")
  private Shelter shelter;

  private String species;
  private String breed;

  @Enumerated(EnumType.STRING) private Sex sex = Sex.UNKNOWN;
  @Enumerated(EnumType.STRING) private NeuterStatus neuterStatus = NeuterStatus.UNKNOWN;
  @Enumerated(EnumType.STRING) private AnimalStatus status = AnimalStatus.AVAILABLE;

  private Integer ageMonths;
  private BigDecimal weightKg;
  private String color;
  private LocalDate intakeDate;
  private String thumbnailUrl;
  @Column(columnDefinition = "TEXT") private String description;

  private String region; // denorm for filter

  @CreationTimestamp private LocalDateTime createdAt;
  @UpdateTimestamp  private LocalDateTime updatedAt;
}
