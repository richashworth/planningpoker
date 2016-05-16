package com.richashworth.planningpoker.service;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

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

}