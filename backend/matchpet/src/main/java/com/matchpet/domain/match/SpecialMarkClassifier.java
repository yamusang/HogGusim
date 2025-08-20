package com.matchpet.domain.match;

import lombok.*;
import java.util.*;
import java.util.regex.Pattern;

public class SpecialMarkClassifier {

  private static final List<String> BLOCK_KW = List.of(
      "교상","공격","사납","무는","입질 심함","광견","심각한 공격성"
  );
  private static final List<String> HOLD_MEDICAL_KW = List.of(
      "파보","전염","격리","치료 중","치료중","수술 예정","감염","폐렴","입원"
  );
  private static final List<String> LIMIT_BEHAVIOR_KW = List.of(
      "분리불안","지속 짖음","짖음 심함","배변 훈련 안됨","활동량 많음","견인 강함","경계 심함","산책 교육 필요"
  );

  private static final List<String> BEGINNER_FRIENDLY_KW = List.of(
      "온순","순함","사람 좋아함","착함","순둥","적응 빠름","기본 훈련","소형"
  );
  private static final List<String> HIGH_ACTIVITY_KW = List.of(
      "활발","에너지","산책 많이","대형","하이퍼","견인"
  );
  private static final List<String> MEDICATION_KW = List.of(
      "투약","복약","약 복용","약 먹","치료 중","치료중"
  );
  private static final List<Pattern> NOISE_PATTERNS = List.of(
      Pattern.compile("주소[:：].*"), Pattern.compile("전화[:：].*"), Pattern.compile("\\d{2,4}-\\d{2,4}-\\d{3,4}")
  );

  public enum RiskLevel { GREEN, CAUTION, LIMIT_BEHAVIOR, HOLD_MEDICAL, BLOCK }

  public static Result classify(String raw) {
    if (raw == null) raw = "";
    String text = cleanup(raw);

    int hitBlock = countHit(text, BLOCK_KW);
    int hitHoldM = countHit(text, HOLD_MEDICAL_KW);
    int hitLimit = countHit(text, LIMIT_BEHAVIOR_KW);

    RiskLevel level;
    if (hitBlock > 0) level = RiskLevel.BLOCK;
    else if (hitHoldM > 0) level = RiskLevel.HOLD_MEDICAL;
    else if (hitLimit > 0) level = RiskLevel.LIMIT_BEHAVIOR;
    else if (text.isBlank()) level = RiskLevel.CAUTION;
    else level = RiskLevel.GREEN;

    boolean beginnerFriendly = containsAny(text, BEGINNER_FRIENDLY_KW);
    boolean highActivity = containsAny(text, HIGH_ACTIVITY_KW);
    boolean medicationRequired = containsAny(text, MEDICATION_KW);
    boolean aggressive = hitBlock > 0;

    return Result.builder()
        .riskLevel(level)
        .beginnerFriendly(beginnerFriendly)
        .highActivity(highActivity)
        .medicationRequired(medicationRequired)
        .aggressive(aggressive)
        .cleanText(text)
        .build();
  }

  private static String cleanup(String s) {
    String t = s;
    for (var p: NOISE_PATTERNS) t = p.matcher(t).replaceAll("");
    return t.replaceAll("[\\s\\n\\r]+"," ").trim();
  }
  private static boolean containsAny(String t, List<String> kws){
    for (String k: kws) if (t.contains(k)) return true;
    return false;
  }
  private static int countHit(String t, List<String> kws){
    int c=0; for(String k: kws) if (t.contains(k)) c++; return c;
  }

  @Getter @Builder
  public static class Result {
    private final RiskLevel riskLevel;
    private final boolean beginnerFriendly;
    private final boolean highActivity;
    private final boolean medicationRequired;
    private final boolean aggressive;
    private final String cleanText;
  }
}
