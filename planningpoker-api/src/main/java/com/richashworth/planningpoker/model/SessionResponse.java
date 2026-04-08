package com.richashworth.planningpoker.model;

import java.util.List;

public record SessionResponse(
    String host, String sessionId, String schemeType, List<String> values, boolean includeUnsure) {}
