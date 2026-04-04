package com.richashworth.planningpoker.controller;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SchemeType;
import com.richashworth.planningpoker.model.SessionResponse;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

import java.util.ArrayList;
import java.util.List;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GameControllerTest extends AbstractControllerTest {

    @InjectMocks
    private GameController gameController;

    @Test
    void testJoinSession() {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        SchemeConfig config = new SchemeConfig("fibonacci", null, true, true);
        when(sessionManager.getSessionSchemeConfig(SESSION_ID)).thenReturn(config);
        List<String> fibValues = SchemeType.resolveValues("fibonacci", null, true, true);
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(fibValues);
        SessionResponse response = gameController.joinSession(SESSION_ID, USER_NAME);
        assertEquals("fibonacci", response.schemeType());
        assertTrue(response.values().contains("0"));
        assertTrue(response.values().contains("?"));
        assertTrue(response.includeUnsure());
        assertTrue(response.includeCoffee());
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
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
        CreateSessionRequest request = new CreateSessionRequest(USER_NAME, null, null, null, null);
        when(sessionManager.createSession(any(SchemeConfig.class))).thenReturn(SESSION_ID);
        List<String> fibValues = SchemeType.resolveValues("fibonacci", null, true, true);
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(fibValues);
        final SessionResponse response = gameController.createSession(request);
        assertEquals(SESSION_ID, response.sessionId());
        assertEquals("fibonacci", response.schemeType());
        assertTrue(response.values().contains("0"));
        assertTrue(response.values().contains("?"));
        assertTrue(response.includeUnsure());
        assertTrue(response.includeCoffee());
        inOrder.verify(sessionManager, times(1)).createSession(any(SchemeConfig.class));
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        verify(sessionManager).getSessionLegalValues(SESSION_ID);
    }

    @Test
    void testCreateSessionWithTshirtScheme() {
        CreateSessionRequest request = new CreateSessionRequest(USER_NAME, "tshirt", null, true, false);
        when(sessionManager.createSession(any(SchemeConfig.class))).thenReturn(SESSION_ID);
        List<String> tshirtValues = SchemeType.resolveValues("tshirt", null, true, false);
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(tshirtValues);
        final SessionResponse response = gameController.createSession(request);
        assertEquals(SESSION_ID, response.sessionId());
        assertEquals("tshirt", response.schemeType());
        assertTrue(response.values().contains("XS"));
        assertTrue(response.values().contains("?"));
        assertFalse(response.values().contains("\u2615"));
        assertTrue(response.includeUnsure());
        assertFalse(response.includeCoffee());
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
        CreateSessionRequest request = new CreateSessionRequest("AB", null, null, null, null);
        assertThrows(IllegalArgumentException.class, () ->
            gameController.createSession(request));
    }

    @Test
    void testCreateSessionRejectsInvalidChars() {
        CreateSessionRequest request = new CreateSessionRequest("<script>", null, null, null, null);
        assertThrows(IllegalArgumentException.class, () ->
            gameController.createSession(request));
    }
}
