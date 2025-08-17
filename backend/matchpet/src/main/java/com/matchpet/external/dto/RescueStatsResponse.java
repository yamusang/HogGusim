// src/main/java/com/matchpet/external/dto/RescueStatsResponse.java
package com.matchpet.external.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RescueStatsResponse {
    @JsonProperty("response")
    private Response response;

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        private Header header;
        private Body body;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {
        private String resultCode;
        private String resultMsg;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Body {
        private Items items;
        private Integer totalCount;
        private Integer pageNo;
        private Integer numOfRows;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Items {
        private List<Map<String, Object>> item; // 통계 item은 키 구성이 유동적일 수 있어 Map으로 수용
    }
}
