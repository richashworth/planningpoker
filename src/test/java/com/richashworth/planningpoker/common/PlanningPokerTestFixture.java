package com.richashworth.planningpoker.common;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;

import java.util.List;

/**
 * Created by Rich Ashworth on 14/08/2016.
 */
public class PlanningPokerTestFixture {
    public static final Long SESSION_ID = 1L;
    public static final String ITEM = "A User Story";
    public static final String USER_NAME = "Rich";
    public static final Double ESTIMATE_VALUE = 2D;
    public static final Estimate ESTIMATE = new Estimate(USER_NAME, ESTIMATE_VALUE);
    public static final List<Estimate> RESULTS = Lists.newArrayList(ESTIMATE);
    public static final List<String> USERS = Lists.newArrayList(USER_NAME);
}
