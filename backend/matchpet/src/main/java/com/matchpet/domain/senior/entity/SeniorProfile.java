package com.matchpet.domain.senior.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.time.LocalDate;

@Entity @Getter @Setter
@Table(name = "seniors")
public class SeniorProfile {
  @Id
  @Column(name = "user_id")
  private Long userId;

  @Column(nullable = false)           private String name;
  @Column(name = "gender")            private String gender;          // "M"/"F" 등
  @Column(name = "phone_number")      private String phoneNumber;
  @Column(nullable = false)           private String address;
  @Column(name = "birth_date")        private LocalDate birthDate;
  @Column(name = "emergency_contact") private String emergencyContact;

  @Column(name = "has_pet_experience", nullable = false)
  private boolean hasPetExperience;

  /** JSON String으로 매핑(문자열 보관 → 서비스에서 ObjectMapper로 파싱) */
  @Column(name = "preferred_pet_info", columnDefinition = "JSON")
  private String preferredPetInfo;

  @Column(name = "care_availability", columnDefinition = "JSON")
  private String careAvailability;

  @Column(name = "terms_agree", nullable = false)   private boolean termsAgree;
  @Column(name = "bodycam_agree", nullable = false) private boolean bodycamAgree;

  @Column(name = "created_at", insertable = false, updatable = false)
  private java.time.LocalDateTime createdAt;

  @Column(name = "updated_at", insertable = false, updatable = false)
  private java.time.LocalDateTime updatedAt;
}
