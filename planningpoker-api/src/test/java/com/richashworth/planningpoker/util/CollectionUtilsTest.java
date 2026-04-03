package com.richashworth.planningpoker.util;

import com.google.common.collect.Sets;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CollectionUtilsTest {

    @Test
    void testContainsIgnoreCase() {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "Paul"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "JOHN"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "gEoRgE"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "ringo"));
    }

    @Test
    void testNotContainsIgnoreCase() {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        assertFalse(CollectionUtils.containsIgnoreCase(inputList, "Richard"));
    }

    @Test
    void testContainsUserEstimate() {
        final String userName = "Rich A";
        final Estimate estimate = new Estimate(userName, "5");
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        assertTrue(CollectionUtils.containsUserEstimate(estimates, userName));
    }

    @Test
    void testNotContainsUserEstimate() {
        final Estimate estimate = new Estimate("Rich A", "5");
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        assertFalse(CollectionUtils.containsUserEstimate(estimates, "Jimmy Page"));
    }
}
