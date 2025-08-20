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
    private String token;
    private String role; // ← String 권장
    private String email;
    private Long userId;
    private String name;
    private String affiliation;
    private String displayName;
    private long expiresAt; // 토큰 만료 시간(epoch sec) 추가 추천
}

// 기본 성질: 불변(immutable), 모든 필드는 final, 세터 없음

// 자동 제공: equals/hashCode/toString, 게터(컴포넌트 접근자)

// 직렬화: Spring Boot 3 + Jackson 최신에서 바로 잘 됨

// 안전성: 생성 시점 이후 값이 안 바뀌니 스레드·보안·버그에 유리

// 문법: 한 줄 선언로 끝 → 보일러플레이트 제로

// 제약: 기본 생성자 없음(“정규 생성자”만), 상속 불가, 상태 변경 불가
// (필드 많고 선택적일 때는 생성자 길어져 약간 번거로울 수 있음)