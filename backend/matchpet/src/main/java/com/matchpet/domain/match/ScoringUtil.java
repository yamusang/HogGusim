package com.matchpet.domain.match;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.match.Enums.Level3;
import com.matchpet.domain.match.Enums.VisitStyle;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;

public class ScoringUtil {
  static int idx(Level3 v){ return switch (v){ case LOW->0; case MID->1; case HIGH->2; }; }

  public static double mobilityMatch(Level3 s, Level3 p){
    if (s==null || p==null) return 0.5;
    int gap = Math.abs(idx(s) - idx(p));
    return 1.0 - (gap/2.0); // 1, 0.5, 0
  }
  public static double visitMatch(VisitStyle s, VisitStyle p){
    if (s==null || p==null) return 0.5;
    if (s==p) return 1.0;
    if ((s==VisitStyle.COMPANION && p==VisitStyle.QUIET) ||
        (p==VisitStyle.COMPANION && s==VisitStyle.QUIET)) return 0.5;
    if ((s==VisitStyle.ACTIVE && p==VisitStyle.QUIET) ||
        (s==VisitStyle.QUIET && p==VisitStyle.ACTIVE)) return 0.0;
    return 0.5;
  }
  public static double techMatch(Level3 tech, boolean deviceRequired){
    if (!deviceRequired) return 1.0;
    if (tech==null) return 0.5;
    return switch (tech){ case LOW->0.2; case MID->0.6; case HIGH->1.0; };
  }

  public static double petScore(Level3 sMob, VisitStyle sVisit, Level3 sTech,
                                Level3 pEnergy, VisitStyle pTemper, boolean deviceReq){
    double m = mobilityMatch(sMob, pEnergy);
    double v = visitMatch(sVisit, pTemper);
    double t = techMatch(sTech, deviceReq);
    return 100.0 * (0.45*m + 0.35*v + 0.20*t);
  }

  // 스킬 태그
  public static Set<String> inferRequiredTags(Animal p){
    Set<String> req = new HashSet<>();
    if (p.getEnergyLevel()!=null){
      switch (p.getEnergyLevel()){
        case HIGH -> req.add("high_energy_handling");
        case MID  -> req.add("basic_activity_support");
        case LOW  -> req.add("low_activity_care");
      }
    }
    if (p.getTemperament()!=null){
      switch (p.getTemperament()){
        case ACTIVE     -> req.add("active_play");
        case QUIET      -> req.add("shy_care");
        case COMPANION  -> req.add("companionship_focus");
      }
    }
    if (p.isDeviceRequired()) req.add("device_friendly");
    return req;
  }

  public static Set<String> parseManagerTags(String jsonOrCsv){
    if (jsonOrCsv==null || jsonOrCsv.isBlank()) return Set.of();
    String s = jsonOrCsv.trim();
    try{
      if (s.startsWith("[")) {
        return new ObjectMapper().readValue(s, new TypeReference<Set<String>>(){})
          .stream().map(String::trim).map(String::toLowerCase).collect(Collectors.toSet());
      }
    } catch(Exception ignore){}
    return Arrays.stream(s.split(","))
      .map(String::trim).filter(x->!x.isEmpty())
      .map(String::toLowerCase).collect(Collectors.toSet());
  }

  public static double skillMatch(Set<String> required, Set<String> manager){
    if (required.isEmpty()) return 1.0;
    if (manager.isEmpty())  return 0.0;
    long covered = required.stream().filter(manager::contains).count();
    return (double) covered / (double) required.size();
  }

  // Manager 점수(경험 50, 신뢰 30, 스킬 20)
  public static double managerScore(Level3 sMob, Level3 mExp, Double reliability, double skill){
    double exp = mobilityMatch(sMob, mExp);
    double rel = reliability==null?0.0:Math.max(0, Math.min(1, reliability));
    double skl = Math.max(0, Math.min(1, skill));
    return 100.0 * (0.50*exp + 0.30*rel + 0.20*skl);
  }
}
