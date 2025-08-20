package com.matchpet.web.dto;
import lombok.Getter; import lombok.Setter;

@Getter @Setter
public class ApplicationCreateRequest {
  private Long petId;
  private String name; private String gender; private Integer age;
  private String experience; private String address;
  private String timeRange; private String days; private String date;
  private String phone; private String emergency;
  private boolean agreeTerms; private boolean agreeBodycam;
  private Integer visitsPerWeek;
}
