package com.richashworth.planningpoker.model;

import java.util.List;

public record RefreshResponse(
    int round,
    List<Estimate> results,
    String label,
    List<String> users,
    String host,
    List<Round> completedRounds,
    List<String> spectators) {}
