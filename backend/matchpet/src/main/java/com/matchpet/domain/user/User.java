package com.matchpet.domain.user;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
// @AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String email;

    @Column(name = "password_hash",nullable = false, length = 100, unique = true)
    private String passwordHash;

    @Enumerated(EnumType.STRING) 
    @Column(nullable = false, length = 255)
    Role role;

    @Column(nullable = false, length = 80)
    private String displayName; // 로그인 응답 name 필드 매핑

    // @Column(nullable = false, updatable = false)
    // private LocalDateTime createdAt;

    // @Column
    // private LocalDateTime lastLoginAt;

}
