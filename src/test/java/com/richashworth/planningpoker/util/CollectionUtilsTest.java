package com.richashworth.planningpoker.util;

import com.google.common.collect.Sets;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.Test;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * Created by Rich Ashworth on 04/05/2016.
 */
public class CollectionUtilsTest {

    @Test
    public void testContainsIgnoreCase() throws Exception {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "Paul"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "JOHN"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "gEoRgE"));
        assertTrue(CollectionUtils.containsIgnoreCase(inputList, "ringo"));
    }

    @Test
    public void testNotContainsIgnoreCase() throws Exception {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        assertFalse(CollectionUtils.containsIgnoreCase(inputList, "Richard"));
    }

    @Test
    public void testContainsUserEstimate() throws Exception {
        final String userName = "Rich A";
        final Estimate estimate = new Estimate(userName, 5D);
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        assertTrue(CollectionUtils.containsUserEstimate(estimates, userName));
    }

    @Test
    public void testNotContainsUserEstimate() throws Exception {
        final Estimate estimate = new Estimate("Rich A", 5D);
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        assertFalse(CollectionUtils.containsUserEstimate(estimates, "Jimmy Page"));
    }
}