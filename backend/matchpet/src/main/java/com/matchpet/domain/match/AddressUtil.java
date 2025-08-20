package com.matchpet.domain.match;

import java.util.regex.*;

public class AddressUtil {
  private static final Pattern CITY_GU = Pattern.compile(
      "(부산광역시)\\s+([가-힣]{2,10}(구|군))"
  );

  public static boolean isInBusan(String addr){
    return addr != null && addr.contains("부산광역시");
  }

  public static String cityGu(String addr){
    if (addr == null) return "";
    var m = CITY_GU.matcher(addr);
    if (m.find()) return (m.group(1) + " " + m.group(2)).trim();
    // fallback: 앞 두 토큰
    String[] t = addr.trim().split("\\s+");
    if (t.length >= 2 && "부산광역시".equals(t[0])) return t[0] + " " + t[1];
    return "";
  }

  /** 부산 내에서 같은 시/구 여부 */
  public static boolean sameCityGuInBusan(String a1, String a2){
    if (!isInBusan(a1) || !isInBusan(a2)) return false;
    return cityGu(a1).equals(cityGu(a2));
  }
}
