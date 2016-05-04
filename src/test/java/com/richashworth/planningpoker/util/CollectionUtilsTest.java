package com.richashworth.planningpoker.util;

import org.junit.Assert;
import org.junit.Test;

import java.util.Arrays;
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

}