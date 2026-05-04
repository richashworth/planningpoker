package com.richashworth.planningpoker.model;

import java.util.List;

public record SessionResponse(
    String host,
    String sessionId,
    String schemeType,
    List<String> values,
    boolean includeUnsure,
    int round,
    List<Estimate> results,
    String label,
    List<Round> completedRounds,
    List<String> spectators) {}
