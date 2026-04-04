package com.richashworth.planningpoker.model;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public enum SchemeType {
    FIBONACCI(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e")),
    TSHIRT(List.of("XS", "S", "M", "L", "XL", "XXL")),
    SIMPLE(List.of("1", "2", "3", "4", "5")),
    TIME(List.of("1h", "½d", "1d", "2d", "1w", "2w", "1mo", "3mo", "6mo+"));

    private static final String UNSURE = "?";
    private static final String COFFEE = "\u2615";
    private static final int MAX_CUSTOM_VALUES = 20;
    private static final int MIN_CUSTOM_VALUES = 2;
    private static final int MAX_VALUE_LENGTH = 10;

    private final List<String> values;

    SchemeType(List<String> values) {
        this.values = values;
    }

    public List<String> getValues() {
        return values;
    }

    public static SchemeType fromString(String name) {
        for (SchemeType type : values()) {
            if (type.name().equalsIgnoreCase(name)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown scheme type: " + name);
    }

    public static List<String> resolveValues(String schemeType, String customValuesCsv,
                                              boolean includeUnsure, boolean includeCoffee) {
        List<String> result;
        if ("custom".equalsIgnoreCase(schemeType)) {
            result = new ArrayList<>(parseAndValidateCustom(customValuesCsv));
        } else {
            result = new ArrayList<>(fromString(schemeType).getValues());
        }
        if (includeUnsure) {
            result.add(UNSURE);
        }
        if (includeCoffee) {
            result.add(COFFEE);
        }
        return Collections.unmodifiableList(result);
    }

    private static List<String> parseAndValidateCustom(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new IllegalArgumentException("Custom values must not be empty");
        }
        List<String> trimmed = Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        if (trimmed.size() < MIN_CUSTOM_VALUES) {
            throw new IllegalArgumentException("Custom scheme requires at least 2 values");
        }
        if (trimmed.size() > MAX_CUSTOM_VALUES) {
            throw new IllegalArgumentException("Custom scheme allows at most 20 values");
        }
        for (String value : trimmed) {
            if (value.length() > MAX_VALUE_LENGTH) {
                throw new IllegalArgumentException(
                        "Custom value '" + value + "' exceeds max length of " + MAX_VALUE_LENGTH);
            }
        }
        return new ArrayList<>(trimmed);
    }
}
