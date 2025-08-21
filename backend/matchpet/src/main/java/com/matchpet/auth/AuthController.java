// src/main/java/com/matchpet/auth/AuthController.java
package com.matchpet.auth;

import com.matchpet.auth.dto.IdResponse;
import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
// import com.matchpet.domain.user.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // ✅ 단일 엔드포인트: role에 따라 분기 (+ 역할별 필수 필드 검증)
  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signup(@Valid @RequestBody SignupCommon req) {
    if (req.getRole() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
    }

    return switch (req.getRole()) {
      case MANAGER -> new IdResponse(authService.signupManager(req));
      case SHELTER -> {
        validateShelter(req);
        yield new IdResponse(authService.signupShelter(req));
      }
      case SENIOR -> {
        validateSenior(req);
        yield new IdResponse(authService.signupSenior(req));
      }
    };
  }

  // (선택) 개별 엔드포인트 유지
  @PostMapping("/signup/manager")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signupManager(@Valid @RequestBody SignupCommon req) {
    // 프론트에서 role을 같이 보내도 되지만, 여기서는 서비스 분기만 사용
    return new IdResponse(authService.signupManager(req));
  }

  @PostMapping("/signup/shelter")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signupShelter(@Valid @RequestBody SignupCommon req) {
    validateShelter(req);
    return new IdResponse(authService.signupShelter(req));
  }

  @PostMapping("/signup/senior")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signupSenior(@Valid @RequestBody SignupCommon req) {
    validateSenior(req);
    return new IdResponse(authService.signupSenior(req));
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    return authService.login(req);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
    authService.logout(authHeader);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/refresh")
  public ResponseEntity<LoginResponse> refresh(@RequestHeader("Authorization") String authHeader) {
    return ResponseEntity.ok(authService.refresh(authHeader));
  }

  // --- 내부 검증 헬퍼 ---
  private void validateShelter(SignupCommon req) {
    if (!StringUtils.hasText(req.getAffiliation())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "affiliation is required for SHELTER");
    }
  }

  private void validateSenior(SignupCommon req) {
    if (!StringUtils.hasText(req.getPhoneNumber())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phoneNumber is required for SENIOR");
    }
    if (!StringUtils.hasText(req.getAddress())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "address is required for SENIOR");
    }
    if (!StringUtils.hasText(req.getEmergencyContact())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "emergencyContact is required for SENIOR");
    }
  }
}
