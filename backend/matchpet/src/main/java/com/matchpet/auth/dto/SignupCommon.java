package com.matchpet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
    @Size(min = 8, max = 72) // bcrypt 등 고려해 72 유지
    private String password;

    @Size(max = 80) // users.displayName NOT NULL이면 서비스에서 기본값 보장 필요
    private String displayName;

    @NotNull
    private Role role; // SENIOR | MANAGER | SHELTER (대문자 문자열 매핑)

    // SHELTER 전용 (users.affiliation VARCHAR(120))
    @Size(max = 120)
    @JsonAlias({ "org", "organization", "company", "aff" })
    private String affiliation;

    // SENIOR 전용 (seniors.phone_number VARCHAR(40))
    @Size(max = 40)
    @Pattern(regexp = "^[0-9\\-+()\\s]{9,20}$",
             message = "전화번호 형식을 확인해 주세요.")
    private String phoneNumber;

    // SENIOR 전용 (seniors.address VARCHAR(255) NOT NULL)
    @Size(max = 255)
    private String address;

    // SENIOR 전용 (seniors.emergency_contact VARCHAR(120))
    @Size(max = 120)
    @Pattern(regexp = "^[0-9\\-+()\\s]{9,20}$",
             message = "비상연락망(전화번호) 형식을 확인해 주세요.")
    private String emergencyContact;
}
