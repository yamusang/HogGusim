package com.matchpet.domain.application.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;
import com.matchpet.domain.application.repository.ApplicationRepository;
import com.matchpet.domain.match.AddressUtil;
import com.matchpet.domain.match.SpecialMarkClassifier;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
import com.matchpet.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ApplicationService {
  private final ApplicationRepository appRepo;
  private final SeniorProfileRepository seniorRepo;
  private final AnimalRepository animalRepo;

  @Transactional
  public Long create(Long userId, ApplicationCreateRequest req){
    if (req.getPetId()==null) throw new IllegalArgumentException("petId required");
    if (!req.isAgreeTerms() || !req.isAgreeBodycam())
      throw new IllegalStateException("약관/바디캠 동의 필요");

    SeniorProfile s = seniorRepo.findById(userId)
        .orElseThrow(() -> new IllegalStateException("시니어 프로필 필요"));
    Animal a = animalRepo.findById(req.getPetId())
        .orElseThrow(() -> new IllegalArgumentException("동물 없음"));

    if (!"보호중".equals(a.getProcessState()))
      throw new IllegalStateException("보호중만 신청 가능");
    if (!AddressUtil.isInBusan(a.getCareAddr()) || !AddressUtil.isInBusan(s.getAddress())
        || !AddressUtil.sameCityGuInBusan(s.getAddress(), a.getCareAddr()))
      throw new IllegalStateException("부산 동일 시/구만 신청 가능");

    var cls = SpecialMarkClassifier.classify(a.getSpecialMark());
    boolean beginner = !s.isHasPetExperience();
    if (beginner && (cls.isAggressive() || cls.isMedicationRequired()))
      throw new IllegalStateException("초보자 제한 개체");

    Application app = Application.builder()
      .seniorUserId(userId).animalId(a.getId()).status(ApplicationStatus.PENDING)
      .name(req.getName()).gender(req.getGender()).applicantAge(req.getAge())
      .experience(req.getExperience()).address(req.getAddress())
      .timeRange(req.getTimeRange()).days(req.getDays()).dateText(req.getDate())
      .phone(req.getPhone()).emergency(req.getEmergency())
      .agreeTerms(req.isAgreeTerms()).agreeBodycam(req.isAgreeBodycam())
      .visitsPerWeek(req.getVisitsPerWeek())
      .build();

    return appRepo.save(app).getId();
  }

  @Transactional(readOnly=true)
  public Page<Application> myApplications(Long userId, Pageable pageable){
    return appRepo.findBySeniorUserId(userId, pageable);
  }

  @Transactional(readOnly=true)
  public Page<ApplicationListItem> listByShelter(String careNm, ApplicationStatus status, Pageable pageable){
    return appRepo.findByShelterAndStatus(careNm, status, pageable)
      .map(app -> {
        var a = animalRepo.findById(app.getAnimalId()).orElse(null);
        var s = seniorRepo.findById(app.getSeniorUserId()).orElse(null);
        return ApplicationListItem.builder()
          .id(app.getId()).status(app.getStatus()).createdAt(app.getCreatedAt())
          .seniorUserId(app.getSeniorUserId())
          .seniorName(s!=null? s.getName(): null)
          .seniorPhone(s!=null? s.getPhoneNumber(): null)
          .animalId(app.getAnimalId())
          .desertionNo(a!=null? a.getDesertionNo(): null)
          .kind(a!=null? a.getKindCd(): null)
          .careNm(a!=null? a.getCareNm(): null)
          .build();
      });
  }

  @Transactional public void approve(Long id){
    var app = appRepo.findById(id).orElseThrow();
    app.setStatus(ApplicationStatus.APPROVED);
  }

  @Transactional public void reject(Long id){
    var app = appRepo.findById(id).orElseThrow();
    app.setStatus(ApplicationStatus.REJECTED);
  }
}
