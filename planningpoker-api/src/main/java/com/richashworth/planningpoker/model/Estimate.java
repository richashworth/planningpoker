package com.richashworth.planningpoker.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Estimate {
    private String userName;
    private String estimateValue;
}
