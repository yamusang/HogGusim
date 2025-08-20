package com.matchpet.domain.senior.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@Entity @Table(name = "seniors")
public class Senior {

    @Id
    @Column(name = "user_id")
    private Long userId;

    private String name;

    // "M"/"F" 또는 null
    private String gender;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String address;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "has_pet_experience")
    private boolean hasPetExperience;

    // JSON을 문자열로 저장
    @Column(name = "preferred_pet_info", columnDefinition = "json")
    private String preferredPetInfo;

    @Column(name = "care_availability", columnDefinition = "json")
    private String careAvailability;

    @Column(name = "terms_agree")
    private boolean termsAgree;

    @Column(name = "bodycam_agree")
    private boolean bodycamAgree;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
