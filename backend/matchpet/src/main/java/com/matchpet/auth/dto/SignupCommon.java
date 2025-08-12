package com.matchpet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.matchpet.domain.user.Role;

@Getter
@NoArgsConstructor
public class SignupCommon {
    @Email
    @NotBlank
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password;

    @Size(max = 80)
    private String displayName;

    @NotNull
    private Role role;

    @Size(max = 120)
    @JsonAlias({ "org", "organization", "company", "aff" })
    private String affiliation;
}
