package com.richashworth.planningpoker.controller;

import com.google.common.collect.Lists;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

import java.util.ArrayList;
import java.util.List;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GameControllerTest extends AbstractControllerTest {

    @InjectMocks
    private GameController gameController;

    @Test
    void testJoinSession() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        gameController.joinSession(SESSION_ID, USER_NAME);
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    void testJoinSessionSameUserName() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        assertThrows(IllegalArgumentException.class, () ->
            gameController.joinSession(SESSION_ID, USER_NAME));
    }

    @Test
    void testJoinInactiveSession() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () ->
            gameController.joinSession(SESSION_ID, USER_NAME));
    }

    @Test
    void testCreateSession() {
        when(sessionManager.createSession()).thenReturn(SESSION_ID);
        final String newSessionId = gameController.createSession(USER_NAME);
        assertEquals(SESSION_ID, newSessionId);
        inOrder.verify(sessionManager, times(1)).createSession();
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    void testRefresh() {
        gameController.refresh(SESSION_ID);
        verify(messagingUtils).sendResultsMessage(SESSION_ID);
        verify(messagingUtils).sendUsersMessage(SESSION_ID);
        verifyNoInteractions(sessionManager);
    }

    @Test
    void testGetSessionUsers() {
        final ArrayList<String> expected = Lists.newArrayList(USER_NAME);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(expected);
        final List<String> results = gameController.getSessionUsers(SESSION_ID);
        assertEquals(expected, results);
        verify(sessionManager, times(1)).getSessionUsers(SESSION_ID);
        verifyNoMoreInteractions(sessionManager);
    }

    @Test
    void testLeaveSession() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        gameController.leaveSession(USER_NAME, SESSION_ID);
        verify(sessionManager, times(1)).removeUser(USER_NAME, SESSION_ID);
        verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
    }

    @Test
    void testReset() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        gameController.reset(SESSION_ID, USER_NAME);
        verify(sessionManager).resetSession(SESSION_ID);
        verify(messagingUtils).burstResultsMessages(SESSION_ID);
        verifyNoMoreInteractions(sessionManager);
    }

    @Test
    void testResetNonMemberRejected() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
        assertThrows(IllegalArgumentException.class, () ->
            gameController.reset(SESSION_ID, USER_NAME));
    }

    @Test
    void testCreateSessionRejectsShortName() {
        assertThrows(IllegalArgumentException.class, () ->
            gameController.createSession("AB"));
    }

    @Test
    void testCreateSessionRejectsInvalidChars() {
        assertThrows(IllegalArgumentException.class, () ->
            gameController.createSession("<script>"));
    }
}
