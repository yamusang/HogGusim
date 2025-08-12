// 공통 회원가입
package com.matchpet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignupCommon {
    
    @Email @NotBlank @Size(min=8, max=64)
    private String email;

    @NotBlank
    @Size(min = 8, max = 64)  // 비밀번호 규칙
    private String password;
}
