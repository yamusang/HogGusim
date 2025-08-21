package com.matchpet.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter; import lombok.Setter;

@Getter @Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SignupRequest {
  // 공통
  private String email;
  private String password;
  private String role;          // SENIOR / MANAGER / SHELTER

  // SHELTER 전용
  private String affiliation;

  // SENIOR 전용
  private String phoneNumber;       // 연락처
  private String address;           // 주소
  private String emergencyContact;  // 비상연락망
}
