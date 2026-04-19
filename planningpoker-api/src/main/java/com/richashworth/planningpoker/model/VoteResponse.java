package com.richashworth.planningpoker.model;

import java.util.List;

public record VoteResponse(int round, List<Estimate> results) {}
