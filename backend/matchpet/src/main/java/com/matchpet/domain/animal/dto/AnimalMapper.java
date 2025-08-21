// src/main/java/com/matchpet/domain/animal/dto/AnimalMapper.java
package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.AnimalCreateRequest;
import com.matchpet.web.dto.CardDto;
import com.matchpet.web.dto.RecoPetDto;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

public final class AnimalMapper {
    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    private AnimalMapper() {}

    /* =========================
     *  새로 추가: 컨트롤러/서비스가 기대하는 매핑
     * ========================= */

    /** 목록/상세 카드용 DTO 매핑 */
    public static CardDto toCard(Animal a) {
        if (a == null) return null;

        // 가공 필드
        Long id = a.getId();
        String thumbnailUrl = thumbnailUrlOf(a); // filename 우선, 없으면 popfile
        String species = safe(a.getKindCd());
        String breed = safe(a.getBreed());       // = kindCd @Transient
        String sexLabel = sexLabelOf(a.getSexCd());
        String neuterLabel = neuterLabelOf(a.getNeuterYn());
        String ageText = safe(a.getAge());
        String color = safe(a.getColorCd());
        String status = a.getStatus() == null ? null : a.getStatus().name();
        String shelterName = safe(a.getCareNm());

        // 1) Lombok @Builder 지원: CardDto.builder().id(...).thumbnailUrl(...).build()
        try {
            Method builderMethod = CardDto.class.getMethod("builder");
            Object builder = builderMethod.invoke(null);
            callIfExists(builder, "id", Long.class, id);
            callIfExists(builder, "thumbnailUrl", String.class, thumbnailUrl);
            callIfExists(builder, "species", String.class, species);
            callIfExists(builder, "breed", String.class, breed);
            callIfExists(builder, "sexLabel", String.class, sexLabel);
            callIfExists(builder, "neuterLabel", String.class, neuterLabel);
            callIfExists(builder, "ageText", String.class, ageText);
            callIfExists(builder, "color", String.class, color);
            callIfExists(builder, "status", String.class, status);
            callIfExists(builder, "shelterName", String.class, shelterName);
            Object built = callIfExists(builder, "build");
            if (built instanceof CardDto dto) return dto;
        } catch (ReflectiveOperationException ignore) {
            // no builder → 아래로 폴백
        }

        // 2) JavaBean 세터 지원: new CardDto(); setId(...); setThumbnailUrl(...); ...
        try {
            CardDto dto = CardDto.class.getDeclaredConstructor().newInstance();
            callIfExists(dto, "setId", Long.class, id);
            callIfExists(dto, "setThumbnailUrl", String.class, thumbnailUrl);
            callIfExists(dto, "setSpecies", String.class, species);
            callIfExists(dto, "setBreed", String.class, breed);
            callIfExists(dto, "setSexLabel", String.class, sexLabel);
            callIfExists(dto, "setNeuterLabel", String.class, neuterLabel);
            callIfExists(dto, "setAgeText", String.class, ageText);
            callIfExists(dto, "setColor", String.class, color);
            callIfExists(dto, "setStatus", String.class, status);
            callIfExists(dto, "setShelterName", String.class, shelterName);
            return dto;
        } catch (ReflectiveOperationException ignore) {
            // no default ctor → 아래로 폴백
        }

        // 3) 레코드/다인자 생성자 지원 (id, thumbnailUrl, species, breed, sexLabel, neuterLabel, ageText, color, status, shelterName)
        try {
            Constructor<?>[] ctors = CardDto.class.getDeclaredConstructors();
            for (Constructor<?> c : ctors) {
                Class<?>[] p = c.getParameterTypes();
                if (p.length == 10) {
                    Object dto = c.newInstance(id, thumbnailUrl, species, breed, sexLabel, neuterLabel, ageText, color, status, shelterName);
                    return (CardDto) dto;
                }
            }
        } catch (ReflectiveOperationException ignore) {}

        // 4) 어쩔 수 없을 때 최소 정보만
        try {
            Constructor<?>[] ctors = CardDto.class.getDeclaredConstructors();
            if (ctors.length > 0) {
                Object dto = ctors[0].newInstance(new Object[ctors[0].getParameterCount()]);
                return (CardDto) dto;
            }
        } catch (ReflectiveOperationException ignore) {}

        throw new IllegalStateException("Cannot construct CardDto via builder/setters/constructors. Please check CardDto shape.");
    }

    /** 추천용 DTO 매핑 */
    public static RecoPetDto toReco(Animal a, double score, String reason) {
        if (a == null) return null;
        return RecoPetDto.builder()
                .id(a.getId())
                .desertionNo(a.getDesertionNo())
                .name(nullSafeName(a)) // 대부분 null이지만 자리 유지
                .breed(safe(a.getBreed()))
                .age(safe(a.getAge()))
                .photoUrl(safe(a.getPopfile()))
                .thumbnail(thumbnailUrlOf(a))
                .sex(sexLabelOf(a.getSexCd()))
                .neuter(neuterLabelOf(a.getNeuterYn()))
                .matchScore(score)
                .reason(reason)
                .build();
    }

    /* =========================
     *  기존: Create DTO -> Entity
     * ========================= */
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
            } catch (Exception ignored) {}
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
        a.setAge(firstNonNull(get(req, "getAge", String.class)));
        a.setWeight(firstNonNull(get(req, "getWeight", String.class)));

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
        Long shelterId = firstNonNull(get(req, "getShelterId", Long.class));
        if (shelterId != null) a.setShelterId(shelterId);

        // deviceRequired (Boolean -> tinyint 0/1)
        Boolean deviceReq = firstNonNull(
                get(req, "getDeviceRequired", Boolean.class),
                get(req, "isDeviceRequired", Boolean.class));
        if (deviceReq != null) a.setDeviceRequired(deviceReq);

        // energyLevel enum
        String energy = firstNonNull(get(req, "getEnergyLevel", String.class));
        if (energy != null) {
            try { a.setEnergyLevel(Animal.EnergyLevel.valueOf(energy.toUpperCase())); }
            catch (Exception ignored) {}
        }

        // temperament enum
        String temp = firstNonNull(get(req, "getTemperament", String.class));
        if (temp != null) {
            try { a.setTemperament(Animal.Temperament.valueOf(temp.toUpperCase())); }
            catch (Exception ignored) {}
        }

        // status enum
        String statusStr = firstNonNull(get(req, "getStatus", String.class));
        if (statusStr != null) {
            try { a.setStatus(Animal.Status.valueOf(statusStr.toUpperCase())); }
            catch (Exception ignored) {}
        }

        return a;
    }

    /* =========================
     *  내부 헬퍼
     * ========================= */

    private static String thumbnailUrlOf(Animal a) {
        // 업로드된 로컬 파일이 있으면 그 경로 우선, 없으면 API 이미지
        return Optional.ofNullable(a.getPopfile())
                .or(() -> Optional.ofNullable(a.getFilename()))
                .orElse(null);
    }

    private static String sexLabelOf(String sexCd) {
        if (sexCd == null) return "-";
        switch (sexCd.trim().toUpperCase()) {
            case "M": case "MALE": return "수컷";
            case "F": case "FEMALE": return "암컷";
            default: return "-";
        }
    }

    private static String neuterLabelOf(String neuterYn) {
        if (neuterYn == null) return "-";
        switch (neuterYn.trim().toUpperCase()) {
            case "Y": case "YES":  return "예";
            case "N": case "NO":   return "아니오";
            default: return "-";
        }
    }

    private static String nullSafeName(Animal a) {
        // 외부 API에 이름이 없을 수 있으니 null 유지. 필요하면 careNm+id 등으로 파생명 생성 가능
        return null;
    }

    // ====== reflection helpers ======
    @SuppressWarnings("unchecked")
    private static <T> T get(Object obj, String methodName, Class<T> type) {
        if (obj == null) return null;
        try {
            Method m = obj.getClass().getMethod(methodName);
            Object v = m.invoke(obj);
            if (v == null) return null;
            if (type.isInstance(v)) return (T) v;
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... vals) {
        if (vals == null) return null;
        for (T v : vals) if (v != null) return v;
        return null;
    }

    /** builder/setter 호출 유틸 */
    private static Object callIfExists(Object target, String method) {
        try {
            Method m = target.getClass().getMethod(method);
            return m.invoke(target);
        } catch (Exception ignore) {
            return null;
        }
    }
    private static <A> void callIfExists(Object target, String method, Class<A> argType, A arg) {
        try {
            Method m = target.getClass().getMethod(method, argType);
            m.invoke(target, arg);
        } catch (Exception ignore) {
            // 해당 세터/빌더 메서드가 없으면 무시(유연성 유지)
        }
    }

    private static String safe(String s) { return s == null ? null : s; }
}

// 