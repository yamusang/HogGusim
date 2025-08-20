// 추천 서비스
package com.matchpet.domain.match;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.senior.entity.SeniorPredictions;
import com.matchpet.domain.senior.repository.SeniorPredictionsRepository;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
import com.matchpet.web.dto.RecoPetDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

  private final SeniorProfileRepository seniorRepo;
  private final AnimalRepository animalRepo;
  private final SeniorPredictionsRepository predictionsRepo; // 선택

  private final ObjectMapper om = new ObjectMapper();

  public enum Mode { conservative, balanced, manager }

  /** 기존 컨트롤러 호환: mode 기본 balanced */
  public Page<RecoPetDto> recommendPets(Long seniorId, Pageable pageable) {
    return recommendPets(seniorId, Mode.balanced, pageable);
  }

  /** 부산 한정 + 하드필터 + 점수화 */
  public Page<RecoPetDto> recommendPets(Long seniorId, Mode mode, Pageable pageable) {
    SeniorProfile s = seniorRepo.findById(seniorId).orElseThrow();

    // 부산 외 주소는 즉시 종료
    if (!AddressUtil.isInBusan(s.getAddress())) return Page.empty(pageable);

    // 동의 필수
    if (!(s.isTermsAgree() && s.isBodycamAgree())) return Page.empty(pageable);

    // 후보 조회: 보호중 + 부산
    Page<Animal> page = animalRepo.findAvailableInBusan(PageRequest.of(
        pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "id"))
    );

    // 추정치(선택)
    SeniorPredictions preds = predictionsRepo != null ? predictionsRepo.findById(seniorId).orElse(null) : null;

    // 시니어 선호/가용 파싱
    JsonNode pref = readJsonSafe(s.getPreferredPetInfo());
    JsonNode care = readJsonSafe(s.getCareAvailability());

    // 스코어
    List<Scored> scored = page.getContent().stream()
        .map(a -> scoreAnimal(a, s, pref, care, preds, mode))
        .filter(Objects::nonNull)
        .sorted(Comparator.comparingDouble(Scored::score).reversed())
        .collect(Collectors.toList());

    // DTO 변환 (RecoPetDto.from(Animal, score, reason) 활용)
    List<RecoPetDto> out = scored.stream()
        .map(sc -> RecoPetDto.from(sc.a, sc.score, String.join(" · ", sc.reasons)))
        .toList();

    return new PageImpl<>(out, pageable, page.getTotalElements());
  }

  private Scored scoreAnimal(Animal a, SeniorProfile s, JsonNode pref, JsonNode care,
                             SeniorPredictions preds, Mode mode) {

    // 부산 내 동일 시/구 필터
    if (!AddressUtil.sameCityGuInBusan(s.getAddress(), a.getCareAddr())) return null;

    // 위험도 분류
    var cls = SpecialMarkClassifier.classify(a.getSpecialMark());

    // 정책 컷
    switch (cls.getRiskLevel()) {
      case BLOCK, HOLD_MEDICAL -> { return null; }
      case LIMIT_BEHAVIOR -> { if (mode == Mode.conservative || mode == Mode.balanced) return null; }
      case CAUTION, GREEN -> { /* ok */ }
    }

    // 초보자 컷: 무경험이면 공격성/투약필수 제외
    boolean beginner = !s.isHasPetExperience();
    if (beginner && (cls.isAggressive() || cls.isMedicationRequired())) return null;

    // 케어 가용정보 비었는데 투약필수 → 컷 (최소한의 가용 확인)
    if (cls.isMedicationRequired() && isEmptyCare(care)) return null;

    double score = 0;
    List<String> reasons = new ArrayList<>();

    // Base 위험도
    switch (cls.getRiskLevel()) {
      case GREEN -> { score += 30; reasons.add("안전도 GREEN +30"); }
      case CAUTION -> { score += 15; reasons.add("안전도 CAUTION +15"); }
      case LIMIT_BEHAVIOR -> { score += 0; reasons.add("안전도 LIMIT +0"); }
      default -> {}
    }

    // 선호 매칭
    double pm = preferredMatch(a, pref, reasons);
    score += pm;

    // 시간 적합도
    int tf = timeFit(care, cls);
    if (tf != 0) { score += tf; reasons.add("시간 적합도 " + (tf > 0 ? "+" : "") + tf); }

    // 초보자 보정
    if (beginner && cls.isBeginnerFriendly()) { score += 3; reasons.add("초보 친화 +3"); }

    // 보류 C 추정 보정
    score += predAdjust(preds, cls, reasons);

    // 정보량 부족 패널티
    if ((a.getSpecialMark() == null || a.getSpecialMark().isBlank())
        && pref == null && care == null) {
      score -= 2; reasons.add("정보 부족 -2");
    }

    return new Scored(a, score, reasons);
  }

  /** 선호: species/size/gender/traits/medical 허용 등 단순 가중 */
  private double preferredMatch(Animal a, JsonNode pref, List<String> reasons) {
    if (pref == null) return 0.0;
    double s = 0.0;

    // species
    if (pref.has("species")) {
      String sp = pref.get("species").asText("");
      if (!sp.isBlank() && isDog(a) && sp.equalsIgnoreCase("DOG")) {
        s += 3; reasons.add("선호(종) +3");
      }
    }
    // size (간단 추정)
    if (pref.has("size")) {
      String want = pref.get("size").asText("").toUpperCase();
      String size = guessSize(a.getKindCd()).toUpperCase();
      if (!want.isBlank() && !size.isBlank()) {
        if (want.equals(size)) { s += 3; reasons.add("선호(사이즈) +3"); }
      }
    }
    // gender
    if (pref.has("gender")) {
      String want = pref.get("gender").asText("").toUpperCase();
      String g = safe(a.getSexCd()).toUpperCase();
      if (!want.isBlank() && !g.isBlank() && want.equals(g)) {
        s += 2; reasons.add("선호(성별) +2");
      }
    }
    // traits (문자열 포함 매칭)
    if (pref.has("traits") && a.getSpecialMark() != null) {
      for (var t : pref.get("traits")) {
        String kw = t.asText();
        if (!kw.isBlank() && a.getSpecialMark().contains(kw)) {
          s += 2; reasons.add("선호(성격) +2");
        }
      }
    }
    // okMedical: 치료/투약 허용
    if (pref.has("okMedical")) {
      boolean ok = pref.get("okMedical").asBoolean(false);
      if (!ok && a.getSpecialMark() != null &&
          (a.getSpecialMark().contains("치료") || a.getSpecialMark().contains("투약"))) {
        s -= 3; reasons.add("치료/투약 비허용 -3");
      }
    }
    return s;
  }

  /** 케어 가용성 간단 점수 (충돌 -3, 일치 +1~+3) */
  private int timeFit(JsonNode care, SpecialMarkClassifier.Result cls) {
    if (care == null) return 0;
    // 매우 단순화: 오전/오후/저녁 키워드 매칭
    var text = care.toString();
    boolean hasMorning = text.contains("오전");
    boolean hasEvening = text.contains("오후") || text.contains("저녁");

    int s = 0;
    if (cls.isHighActivity()) {
      if (hasMorning && hasEvening) s += 3;
      else if (hasMorning || hasEvening) s += 1;
      else s -= 3;
    } else {
      if (hasMorning || hasEvening) s += 1;
    }
    return s;
  }

  /** 보류 C 추정 보정 (conf * 미세가중) */
  private double predAdjust(SeniorPredictions p, SpecialMarkClassifier.Result cls, List<String> reasons) {
    if (p == null) return 0.0;
    double delta = 0.0;

    // mobility: LOW일수록 고활동 -5, 온순/소형 +3 (conf 백분율 반영)
    if (p.getPredMobility() != null && p.getConfMobility() != null) {
      double conf = p.getConfMobility() / 100.0;
      if ("LOW".equals(p.getPredMobility().name())) {
        if (cls.isHighActivity()) { delta -= 5 * conf; reasons.add("이동제약 × 고활동 " + fmt(delta)); }
        else { delta += 3 * conf; reasons.add("이동제약 × 온순 " + fmt(+3 * conf)); }
      }
    }
    // visit style: QUIET이면 고활동 약감점
    if (p.getPredVisitStyle() != null && p.getConfVisitStyle() != null) {
      double conf = p.getConfVisitStyle() / 100.0;
      if ("QUIET".equals(p.getPredVisitStyle().name()) && cls.isHighActivity()) {
        delta -= 3 * conf; reasons.add("조용 선호 × 고활동 " + fmt(-3 * conf));
      }
    }
    // tech comfort: LOW면 관리 복잡 -2
    if (p.getPredTech() != null && p.getConfTech() != null) {
      double conf = p.getConfTech() / 100.0;
      if ("LOW".equals(p.getPredTech().name())) {
        delta += 2 * conf; reasons.add("기술 친숙도 LOW → 단순 관리 선호 +" + fmt(2 * conf));
      }
    }
    return delta;
  }

  // ----------------- helpers -----------------
  private JsonNode readJsonSafe(String raw) {
    try {
      if (raw == null || raw.isBlank()) return null;
      return om.readTree(raw);
    } catch (Exception e) {
      log.warn("JSON parse failed: {}", raw);
      return null;
    }
  }
  private boolean isDog(Animal a){ return safe(a.getKindCd()).contains("개"); }
  private String safe(String s){ return s == null ? "" : s; }

  private String guessSize(String kindCd){
    String k = safe(kindCd);
    if (k.contains("소형")) return "SMALL";
    if (k.contains("중형")) return "MEDIUM";
    if (k.contains("대형")) return "LARGE";
    return "";
  }
  private boolean isEmptyCare(JsonNode n){ return n == null || n.isEmpty() || "{}".equals(n.toString()); }
  private String fmt(double v){ return (v >= 0 ? "+" : "") + String.format("%.1f", v); }

  private record Scored(Animal a, double score, List<String> reasons) {}
}
