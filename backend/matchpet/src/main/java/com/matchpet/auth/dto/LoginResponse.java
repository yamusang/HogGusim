// 로그인 응답
package com.matchpet.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    // 추가 필드 1: 시니어일 때 내려줄 최소 프로필
    private com.matchpet.auth.dto.SeniorMinimalDto seniorProfile;

    // 추가 필드 2: 최소 프로필이 완성되었는지(주소/전화/비상연락망 모두 true)
    private boolean profileComplete;

    private String token;
    private String role; // ← String 권장
    private String email;
    private Long userId;
    private String name;
    private String affiliation;
    private String displayName;
    private long expiresAt; // 토큰 만료 시간(epoch sec) 추가 추천
}