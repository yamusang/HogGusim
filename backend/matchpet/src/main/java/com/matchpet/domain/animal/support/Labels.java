package com.matchpet.domain.animal.support;

import com.matchpet.domain.animal.enums.*;

public final class Labels {
  private Labels() {}
  public static String sex(Sex s){
    return switch (s){ case MALE -> "수컷"; case FEMALE -> "암컷"; default -> "미상"; };
  }
  public static String neuter(NeuterStatus n){
    return switch (n){ case NEUTERED -> "수컷 중성화"; case SPAYED -> "암컷 중성화"; default -> "미상"; };
  }
  public static String ageText(Integer months){
    if (months == null) return "미상";
    int y = months / 12, m = months % 12;
    return (y>0? "만 "+y+"세 " : "") + (m>0? m+"개월" : (y>0? "" : "미상"));
  }
}
