package com.matchpet.domain.application.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
@Entity @Table(name = "applications")
public class Application {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "senior_id")
    private Long seniorId;     // seniors.user_id

    @Column(name = "animal_id")
    private Long animalId;     // animals.id

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;
    public enum Status { PENDING, APPROVED, REJECTED }

    @Column(name = "reserved_at")
    private LocalDateTime reservedAt;

    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
