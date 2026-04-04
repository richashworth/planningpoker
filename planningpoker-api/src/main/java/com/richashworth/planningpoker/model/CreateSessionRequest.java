package com.richashworth.planningpoker.model;

public record CreateSessionRequest(
        String userName,
        String schemeType,
        String customValues,
        Boolean includeUnsure,
        Boolean includeCoffee
) {}
