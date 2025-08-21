package com.matchpet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.matchpet.domain.user.Role;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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

    private String phoneNumber; // SENIOR 전용
    private String address; // SENIOR 전용
    private String emergencyContact; // SENIOR 전용
}
