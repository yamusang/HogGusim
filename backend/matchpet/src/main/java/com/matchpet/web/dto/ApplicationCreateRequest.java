package com.matchpet.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)   // ★ 추가
@Getter @Setter
public class ApplicationCreateRequest {
    private Long petId;
    private String note;

    // (선택) 있어도 되고 없어도 됨 - 서버에선 안 씀
    private Boolean agreeTerms;
    private Boolean agreeBodycam;

    // 필요한 경우에만 나머지 폼 필드들 추가
}
