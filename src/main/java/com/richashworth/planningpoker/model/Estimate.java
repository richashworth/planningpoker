package com.richashworth.planningpoker.model;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Created by rich on 09/04/2016.
 */
@Data
@AllArgsConstructor
public class Estimate {
    private String userId;
    private int estimateValue;
}
