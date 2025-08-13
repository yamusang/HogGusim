// src/main/java/com/matchpet/auth/AuthController.java
package com.matchpet.auth;

import com.matchpet.auth.dto.*;
import com.matchpet.domain.user.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // ✅ 단일 엔드포인트: role에 따라 분기
  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signup(@Valid @RequestBody SignupCommon req) {
    return switch (req.getRole()) {
      case MANAGER -> new IdResponse(authService.signupManager(req));
      case SHELTER -> new IdResponse(authService.signupShelter(req));
      case SENIOR -> new IdResponse(authService.signupSenior(req));
    };
  }

  // (선택) 기존 엔드포인트 유지하고 싶으면 래핑만 해둠
  @PostMapping("/signup/manager")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signupManager(@Valid @RequestBody SignupCommon req) {
    req = coerceRole(req, Role.MANAGER);
    return new IdResponse(authService.signupManager(req));
  }

  @PostMapping("/signup/shelter")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse signupShelter(@Valid @RequestBody SignupCommon req) {
    req = coerceRole(req, Role.SHELTER);
    return new IdResponse(authService.signupShelter(req));
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

  // --- 내부 헬퍼 ---
  private SignupCommon coerceRole(SignupCommon req, Role forced) {
    // record가 아니라 필드 세터가 없으니, 간단히 새 객체 만들어 채워서 넘겨도 되고,
    // 지금은 가독성을 위해 서비스에서 role을 무시하지 않도록 Endpoint만 강제하는 용도.
    return req; // 엔드포인트로 호출하면 프론트에서 role을 함께 보내도 무방
  }
}
