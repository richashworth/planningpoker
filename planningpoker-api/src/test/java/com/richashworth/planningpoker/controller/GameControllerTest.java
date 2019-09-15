package com.richashworth.planningpoker.controller;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Lists;
import com.richashworth.planningpoker.service.SessionManager;
import org.junit.Test;
import org.mockito.InjectMocks;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

public class GameControllerTest extends AbstractControllerTest {

    @InjectMocks
    private GameController gameController;

    @Test
    public void testJoinSession() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        gameController.joinSession(SESSION_ID, USER_NAME);
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils).burstUsersMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testJoinSessionSameUserName() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        gameController.joinSession(SESSION_ID, USER_NAME);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testJoinInactiveSession() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
        gameController.joinSession(SESSION_ID, USER_NAME);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testJoinInvalidSession() throws Exception {
        gameController.joinSession(SessionManager.SESSION_SEQ_START_VALUE - 1, USER_NAME);
    }

    @Test
    public void testCreateSession() throws Exception {
        when(sessionManager.createSession()).thenReturn(SESSION_ID);
        final Long newSessionId = gameController.createSession(USER_NAME);
        assertEquals(SESSION_ID, newSessionId);
        inOrder.verify(sessionManager, times(1)).createSession();
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    public void testRefresh() throws Exception {
        gameController.refresh(SESSION_ID);
        verify(messagingUtils).sendResultsMessage(SESSION_ID);
        verify(messagingUtils).sendUsersMessage(SESSION_ID);
        verifyZeroInteractions(sessionManager);
    }

    @Test
    public void testGetSessionUsers() throws Exception {
        final ArrayList<String> expected = Lists.newArrayList(USER_NAME);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(expected);
        final List<String> results = gameController.getSessionUsers(SESSION_ID);
        assertEquals(expected, results);
        verify(sessionManager).getSessionUsers(SESSION_ID);
        verifyNoMoreInteractions(sessionManager);
    }

    @Test
    public void testGetSessions() throws Exception {
        final ListMultimap<Long, String> expectedSessions = ArrayListMultimap.create();
        expectedSessions.put(SESSION_ID, USER_NAME);
        when(sessionManager.getSessions()).thenReturn(expectedSessions);
        final Map<Long, List<String>> results = gameController.getSessions();
        assertEquals(expectedSessions.asMap(), results);
        verify(sessionManager, times(1)).getSessions();
        verifyNoMoreInteractions(sessionManager);
    }

    @Test
    public void testReset() throws Exception {
        gameController.reset(SESSION_ID, USER_NAME);
        verify(sessionManager).resetSession(SESSION_ID);
        verify(messagingUtils).burstResultsMessages(SESSION_ID);
        verifyNoMoreInteractions(sessionManager);
    }

}
