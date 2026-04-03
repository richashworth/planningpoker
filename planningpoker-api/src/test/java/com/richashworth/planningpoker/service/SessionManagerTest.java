package com.richashworth.planningpoker.service;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SessionManagerTest {

    private SessionManager sessionManager;

    @BeforeEach
    void setUp() {
        sessionManager = new SessionManager();
    }

    @Test
    void testIsSessionActive() {
        String sessionId = sessionManager.createSession();
        assertTrue(sessionManager.isSessionActive(sessionId));
        assertFalse(sessionManager.isSessionActive("nonexistent"));
    }

    @Test
    void testSessionIdsAreUnique() {
        String session1 = sessionManager.createSession();
        String session2 = sessionManager.createSession();
        assertNotEquals(session1, session2);
    }

    @Test
    void testGetResults() {
        final String sessionId = sessionManager.createSession();
        final Estimate estimate = new Estimate("Rich A", "5");
        sessionManager.registerEstimate(sessionId, estimate);
        final List<Estimate> results = sessionManager.getResults(sessionId);
        assertEquals(Lists.newArrayList(estimate), results);
    }

    @Test
    void testGetSessionUsers() {
        final String sessionId = sessionManager.createSession();
        final ArrayList<String> users = Lists.newArrayList("Alice", "Bob", "Marvin");
        registerUsers(sessionId, users);
        sessionManager.registerUser("Frank Z", sessionManager.createSession());
        assertEquals(users, sessionManager.getSessionUsers(sessionId));
    }

    @Test
    void testClearSessions() {
        final String sessionId = sessionManager.createSession();
        sessionManager.registerUser("Rich", sessionId);
        sessionManager.registerEstimate(sessionId, new Estimate("Rich", "8"));
        sessionManager.clearSessions();

        assertFalse(sessionManager.isSessionActive(sessionId));
    }

    @Test
    void testResetSession() {
        final String sessionId = sessionManager.createSession();
        final String userName = "Rich";
        sessionManager.registerUser(userName, sessionId);
        sessionManager.registerEstimate(sessionId, new Estimate(userName, "1"));
        sessionManager.resetSession(sessionId);
        assertTrue(sessionManager.getResults(sessionId).isEmpty());
        assertEquals(Lists.newArrayList(userName), sessionManager.getSessionUsers(sessionId));
    }

    @Test
    void testRemoveUserCleansUpEstimates() {
        final String sessionId = sessionManager.createSession();
        sessionManager.registerUser("Alice", sessionId);
        sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
        sessionManager.removeUser("Alice", sessionId);
        assertTrue(sessionManager.getResults(sessionId).isEmpty());
        assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
    }

    private void registerUsers(String sessionId, ArrayList<String> users) {
        for (String user : users) {
            sessionManager.registerUser(user, sessionId);
        }
    }

}
