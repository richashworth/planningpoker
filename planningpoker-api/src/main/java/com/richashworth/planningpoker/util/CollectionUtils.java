package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.model.Estimate;

import java.util.Collection;

/**
 * Created by Rich Ashworth on 04/05/2016.
 */
public class CollectionUtils {

    private CollectionUtils() {
    }

    public static boolean containsIgnoreCase(final Collection<String> collection, final String matching) {
        return collection.stream().anyMatch(input -> input.equalsIgnoreCase(matching));
    }

    public static boolean containsUserEstimate(final Collection<Estimate> estimates, final String userName) {
        return estimates.stream().anyMatch(input -> input.getUserName().equalsIgnoreCase(userName));
    }
}
