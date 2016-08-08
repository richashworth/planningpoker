package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
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

    @Test
    public void testGetSessionUsers() throws Exception {
        final Long sessionId = sessionManager.createSession();
        final ArrayList<String> users = Lists.newArrayList("Alice", "Bob", "Marvin");
        registerUsers(sessionId, users);
        sessionManager.registerUser("Frank Z", sessionManager.createSession());
        assertEquals(users, sessionManager.getSessionUsers(sessionId));
    }


    @Test
    public void testGetGames() throws Exception {
        final Long sessionOne = sessionManager.createSession();
        final Long sessionTwo = sessionManager.createSession();
        final ArrayList<String> sessionOneUsers = Lists.newArrayList("Rich", "Helen", "Tim");
        final ArrayList<String> sessionTwoUsers = Lists.newArrayList("Jan", "Toby", "Dani");
        final ListMultimap<Long, String> expectedGames = ArrayListMultimap.create();

        for (String user : sessionOneUsers) {
            expectedGames.put(sessionOne, user);
        }
        for (String user : sessionTwoUsers) {
            expectedGames.put(sessionTwo, user);
        }
        final ListMultimap<Long, String> games = sessionManager.getGames();

        registerUsers(sessionOne, sessionOneUsers);
        registerUsers(sessionTwo, sessionTwoUsers);
        assertEquals(expectedGames, games);
    }

    @Test
    public void testClearSessions() {
        final Long sessionId = sessionManager.createSession();
        sessionManager.registerUser("Rich", sessionId);
        sessionManager.registerEstimate(sessionId, new Estimate("Rich", 8D));
        sessionManager.setCurrentItem(sessionId, "my user story");
        sessionManager.clearSessions();

        assertTrue(sessionManager.getResults(sessionId).isEmpty());
        assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
        assertNull(sessionManager.getCurrentItem(sessionId));

        assertEquals(sessionId, sessionManager.createSession());
    }

    private void registerUsers(Long sessionId, ArrayList<String> users) {
        for (String user : users) {
            sessionManager.registerUser(user, sessionId);
        }
    }

}