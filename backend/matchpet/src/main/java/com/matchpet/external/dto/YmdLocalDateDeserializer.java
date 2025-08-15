// src/main/java/com/matchpet/external/dto/YmdLocalDateDeserializer.java
package com.matchpet.external.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class YmdLocalDateDeserializer extends JsonDeserializer<LocalDate> {
  private static final DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyyMMdd");
  @Override public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    String s = p.getValueAsString();
    if (s == null || s.isBlank()) return null;
    return LocalDate.parse(s.trim(), F);
  }
}
