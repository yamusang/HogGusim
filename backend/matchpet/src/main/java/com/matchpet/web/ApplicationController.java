package com.matchpet.web;

import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.application.service.ApplicationService;
import com.matchpet.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/applications")
public class ApplicationController {
  private final ApplicationService service;

  private Long currentUserId(){
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth==null || auth.getPrincipal()==null) throw new IllegalStateException("인증 필요");
    return (Long) auth.getPrincipal(); // JwtAuthFilter에서 userId를 principal로 셋
  }

  @PostMapping
  public IdResponse create(@RequestBody ApplicationCreateRequest req){
    return new IdResponse(service.create(currentUserId(), req));
  }

  // 시니어 본인 신청 목록
  @GetMapping
  public Page<ApplicationResponse> mine(@RequestParam(defaultValue="0") int page,
                                        @RequestParam(defaultValue="10") int size){
    var p = service.myApplications(currentUserId(), PageRequest.of(page, size, Sort.by("id").descending()));
    return p.map(ApplicationResponse::from);
  }

  // 보호소별 목록
  @GetMapping(params = "careNm")
  public Page<ApplicationListItem> byShelter(@RequestParam String careNm,
                     @RequestParam(required=false) String status,
                     @RequestParam(defaultValue="0") int page,
                     @RequestParam(defaultValue="20") int size){
    ApplicationStatus st = null;
    if (status!=null && !status.isBlank()) st = ApplicationStatus.valueOf(status.toUpperCase());
    return service.listByShelter(careNm, st, PageRequest.of(page, size, Sort.by("id").descending()));
  }

  @PostMapping("/{id}/approve") public void approve(@PathVariable Long id){ service.approve(id); }
  @PostMapping("/{id}/reject")  public void reject (@PathVariable Long id){ service.reject(id); }

  public record IdResponse(Long id) {}
}
