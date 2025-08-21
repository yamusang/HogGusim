package com.matchpet.domain.application.entity;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.manager.entity.ManagerProfile;
import com.matchpet.domain.senior.entity.Senior;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ---- FK 원시값 컬럼 (DB 반영용) ----
    @Column(name = "senior_id", nullable = false)
    private Long seniorId;

    @Column(name = "animal_id", nullable = false)
    private Long animalId;

    @Column(name = "manager_id")
    private Long managerId; // nullable

    // ---- 상태/메타 ----
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "reserved_at")
    private LocalDateTime reservedAt;

    @Lob
    private String note;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    private LocalDateTime updatedAt;

    // ---- 연관관계 (읽기용) ----
    // 원시 FK 값을 유지하면서 연관 객체를 읽기 전용으로 붙입니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", referencedColumnName = "id",
            insertable = false, updatable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", referencedColumnName = "user_id",
            insertable = false, updatable = false)
    private Senior senior;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", referencedColumnName = "user_id",
            insertable = false, updatable = false)
    private ManagerProfile manager;
}
