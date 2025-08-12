package com.matchpet.domain.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String email;

    // 비밀번호는 unique 주지 마! (동일 해시 있으면 장애)
    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) // 255 → 20 로 축소 권장
    private Role role;

    @Column(nullable = false, length = 80)
    private String displayName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastLoginAt;

    @Column(length = 120)
    private String affiliation;
}

