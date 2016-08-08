package com.richashworth.planningpoker.util;

import com.google.common.collect.Sets;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.Assert;
import org.junit.Test;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

/**
 * Created by Rich Ashworth on 04/05/2016.
 */
public class CollectionUtilsTest {

    @Test
    public void testContainsIgnoreCase() throws Exception {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        Assert.assertTrue(CollectionUtils.containsIgnoreCase(inputList, "Paul"));
        Assert.assertTrue(CollectionUtils.containsIgnoreCase(inputList, "JOHN"));
        Assert.assertTrue(CollectionUtils.containsIgnoreCase(inputList, "gEoRgE"));
        Assert.assertTrue(CollectionUtils.containsIgnoreCase(inputList, "ringo"));
    }

    @Test
    public void testNotContainsIgnoreCase() throws Exception {
        final List<String> inputList = Arrays.asList("John", "Paul", "George", "Ringo");
        Assert.assertFalse(CollectionUtils.containsIgnoreCase(inputList, "Richard"));
    }

    @Test
    public void testContainsUserEstimate() throws Exception {
        final String userName = "Rich A";
        final Estimate estimate = new Estimate(userName, 5D);
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        Assert.assertTrue(CollectionUtils.containsUserEstimate(estimates, userName));
    }

    @Test
    public void testNotContainsUserEstimate() throws Exception {
        final Estimate estimate = new Estimate("Rich A", 5D);
        final Collection<Estimate> estimates = Sets.newHashSet(estimate);
        Assert.assertFalse(CollectionUtils.containsUserEstimate(estimates, "Jimmy Page"));
    }
}