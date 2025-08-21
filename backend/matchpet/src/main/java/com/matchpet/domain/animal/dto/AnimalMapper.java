package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.AnimalCreateRequest;
import com.matchpet.web.dto.CardDto;
import com.matchpet.web.dto.RecoPetDto;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class AnimalMapper {
    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    private AnimalMapper() {
    }

    // ... (toCard, toReco는 기존 그대로 두세요)

    /** Create DTO -> Entity 매핑 (필드명이 달라도 안전하게: 존재하는 메서드만 사용) */
    public static Animal fromCreate(AnimalCreateRequest req) {
        Animal a = new Animal();

        // desertionNo
        a.setDesertionNo(firstNonNull(
                get(req, "getDesertionNo", String.class),
                get(req, "getDesertion_no", String.class)));

        // happenDt (String "YYYY-MM-DD" 혹은 LocalDate 모두 허용)
        Object happen = firstNonNull(
                get(req, "getHappenDt", Object.class),
                get(req, "getHappenDate", Object.class),
                get(req, "getHappen_at", Object.class));
        if (happen instanceof String s && !s.isBlank()) {
            try {
                a.setHappenDt(LocalDate.parse(s, D));
            } catch (Exception ignored) {
            }
        } else if (happen instanceof LocalDate ld) {
            a.setHappenDt(ld);
        }

        // happenPlace
        a.setHappenPlace(firstNonNull(
                get(req, "getHappenPlace", String.class),
                get(req, "getPlace", String.class)));

        // kindCd (breed/ kind / kindCd 중 있는 것 사용)
        a.setKindCd(firstNonNull(
                get(req, "getKindCd", String.class),
                get(req, "getKind", String.class),
                get(req, "getBreed", String.class)));

        // colorCd
        a.setColorCd(firstNonNull(
                get(req, "getColorCd", String.class),
                get(req, "getColor", String.class)));

        // age, weight
        a.setAge(firstNonNull(
                get(req, "getAge", String.class)));
        a.setWeight(firstNonNull(
                get(req, "getWeight", String.class)));

        // sexCd
        a.setSexCd(firstNonNull(
                get(req, "getSexCd", String.class),
                get(req, "getSex", String.class)));

        // neuterYn
        a.setNeuterYn(firstNonNull(
                get(req, "getNeuterYn", String.class),
                get(req, "getNeuter", String.class)));

        // specialMark
        a.setSpecialMark(firstNonNull(
                get(req, "getSpecialMark", String.class),
                get(req, "getRemark", String.class)));

        // careNm, careTel, careAddr
        a.setCareNm(firstNonNull(
                get(req, "getCareNm", String.class),
                get(req, "getCareName", String.class)));
        a.setCareTel(get(req, "getCareTel", String.class));
        a.setCareAddr(firstNonNull(
                get(req, "getCareAddr", String.class),
                get(req, "getAddress", String.class)));

        // processState
        a.setProcessState(firstNonNull(
                get(req, "getProcessState", String.class),
                get(req, "getState", String.class)));

        // 이미지/썸네일
        a.setFilename(firstNonNull(
                get(req, "getThumbnail", String.class),
                get(req, "getFilename", String.class)));
        a.setPopfile(firstNonNull(
                get(req, "getImage", String.class),
                get(req, "getPopfile", String.class),
                get(req, "getPhotoUrl", String.class)));

        // --- 서비스 확장 필드 ---
        // shelterId
        Long shelterId = firstNonNull(
                get(req, "getShelterId", Long.class));
        if (shelterId != null)
            a.setShelterId(shelterId);

        // deviceRequired (Boolean -> tinyint 0/1)
        Boolean deviceReq = firstNonNull(
                get(req, "getDeviceRequired", Boolean.class),
                get(req, "isDeviceRequired", Boolean.class));
        if (deviceReq != null) {
            a.setDeviceRequired(deviceReq);
        }

        // energyLevel enum
        String energy = firstNonNull(
                get(req, "getEnergyLevel", String.class));
        if (energy != null) {
            try {
                a.setEnergyLevel(Animal.EnergyLevel.valueOf(energy.toUpperCase()));
            } catch (Exception ignored) {
            }
        }

        // temperament enum
        String temp = firstNonNull(
                get(req, "getTemperament", String.class));
        if (temp != null) {
            try {
                a.setTemperament(Animal.Temperament.valueOf(temp.toUpperCase()));
            } catch (Exception ignored) {
            }
        }

        // status enum
        String status = firstNonNull(
                get(req, "getStatus", String.class));
        if (status != null) {
            try {
                a.setStatus(Animal.Status.valueOf(status.toUpperCase()));
            } catch (Exception ignored) {
            }
        }

        return a;
    }

    // ====== helpers ======
    @SuppressWarnings("unchecked")
    private static <T> T get(Object obj, String methodName, Class<T> type) {
        if (obj == null)
            return null;
        try {
            Method m = obj.getClass().getMethod(methodName);
            Object v = m.invoke(obj);
            if (v == null)
                return null;
            if (type.isInstance(v))
                return (T) v;
            // String으로 들어온 것을 다른 타입으로 쓰고 싶은 경우는 여기서 변환 가능
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... vals) {
        if (vals == null)
            return null;
        for (T v : vals)
            if (v != null)
                return v;
        return null;
    }
}
