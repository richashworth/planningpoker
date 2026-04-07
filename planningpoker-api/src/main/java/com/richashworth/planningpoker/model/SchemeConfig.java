package com.richashworth.planningpoker.model;

import java.util.List;

public record SchemeConfig(
    String schemeType, List<String> customValues, boolean includeUnsure, boolean includeCoffee) {}
