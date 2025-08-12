// src/main/java/com/matchpet/auth/dto/SignupCommon.java
package com.matchpet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class SignupCommon {
    @Email @NotBlank @Size(max = 255)
    private String email;

    @NotBlank @Size(min = 8, max = 72) // BCrypt는 72자 초과시 잘림
    private String password;

    @Size(max = 80)
    private String displayName; // 옵션: 비우면 이메일의 로컬파트로 자동 생성
}
