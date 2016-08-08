package com.richashworth.planningpoker.service;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.Before;
import org.junit.Test;

import java.util.List;

import static org.junit.Assert.*;

/**
 * Created by Rich Ashworth on 14/05/2016.
 */
public class SessionManagerTest {

    private SessionManager sessionManager;

    @Before
    public void setup() {
        sessionManager = new SessionManager();
    }

    @Test
    public void testGetCurrentItem() throws Exception {
        final Long sessionId = sessionManager.createSession();
        sessionManager.setCurrentItem(sessionId, "first");
        sessionManager.setCurrentItem(sessionId, "second");
        sessionManager.setCurrentItem(sessionId, "last");
        assertEquals("last", sessionManager.getCurrentItem(sessionId));
    }

    @Test
    public void testIsSessionActive() throws Exception {
        sessionManager.createSession();
        sessionManager.createSession();
        assertFalse(sessionManager.isSessionActive(0L));
        assertTrue(sessionManager.isSessionActive(1L));
        assertTrue(sessionManager.isSessionActive(2L));
        assertFalse(sessionManager.isSessionActive(3L));
    }

    @Test
    public void testGetResults() throws Exception {
        final Long sessionId = sessionManager.createSession();
        final Estimate estimate = new Estimate("Rich A", 5D);
        sessionManager.registerEstimate(sessionId, estimate);
        final List<Estimate> results = sessionManager.getResults(sessionId);
        assertEquals(Lists.newArrayList(estimate), results);
    }

}