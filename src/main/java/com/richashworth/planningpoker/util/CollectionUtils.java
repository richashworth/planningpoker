package com.richashworth.planningpoker.util;

import com.google.common.base.Predicate;
import com.google.common.collect.FluentIterable;
import com.richashworth.planningpoker.model.Estimate;

import java.util.Collection;

/**
 * Created by Rich Ashworth on 04/05/2016.
 */
public class CollectionUtils {

    private CollectionUtils(){

    }

    public static boolean containsIgnoreCase(final Collection<String> collection, final String matching) {
        return FluentIterable.from(collection).anyMatch(new Predicate<String>() {
            @Override
            public boolean apply(String input) {
                return input.equalsIgnoreCase(matching);
            }
        });
    }

    public static boolean containsUserEstimate(final Collection<Estimate> estimates, final String userName) {
        return FluentIterable.from(estimates).anyMatch(new Predicate<Estimate>() {
            @Override
            public boolean apply(Estimate input) {
                return input.getUserName().equalsIgnoreCase(userName);
            }
        });
    }
}
