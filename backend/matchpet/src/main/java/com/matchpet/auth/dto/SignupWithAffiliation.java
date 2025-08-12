package com.matchpet.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class SignupWithAffiliation extends SignupCommon {
    @NotBlank @Size(max = 120)
    private String affiliation; // 기관/보호소명
}
