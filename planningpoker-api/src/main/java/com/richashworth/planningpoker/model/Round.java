package com.richashworth.planningpoker.model;

import java.util.List;

public record Round(
    int round, String label, String consensus, List<Estimate> votes, String timestamp) {}
