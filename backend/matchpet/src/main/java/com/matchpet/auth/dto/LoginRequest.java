package com.matchpet.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginRequest {
    
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 64)
    private String password;

    private SeniorMinimalUpsert seniorProfile;
}
