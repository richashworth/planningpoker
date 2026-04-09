package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SchemeType;
import com.richashworth.planningpoker.model.SessionResponse;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

class GameControllerTest extends AbstractControllerTest {

  @InjectMocks private GameController gameController;

  @Test
  void testJoinSession() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    SchemeConfig config = new SchemeConfig("fibonacci", null, true);
    when(sessionManager.getSessionSchemeConfig(SESSION_ID)).thenReturn(config);
    List<String> fibValues = SchemeType.resolveValues("fibonacci", null, true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(fibValues);
    when(sessionManager.getHost(SESSION_ID)).thenReturn("HostUser");
    SessionResponse response = gameController.joinSession(SESSION_ID, USER_NAME);
    assertEquals("fibonacci", response.schemeType());
    assertTrue(response.values().contains("1"));
    assertTrue(response.values().contains("?"));
    assertTrue(response.includeUnsure());
    assertEquals("HostUser", response.host());
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
  }

  @Test
  void testJoinSessionSameUserName() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    assertThrows(
        IllegalArgumentException.class, () -> gameController.joinSession(SESSION_ID, USER_NAME));
  }

  @Test
  void testJoinInactiveSession() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
    assertThrows(
        IllegalArgumentException.class, () -> gameController.joinSession(SESSION_ID, USER_NAME));
  }

  @Test
  void testCreateSession() {
    CreateSessionRequest request = new CreateSessionRequest(USER_NAME, null, null, null);
    when(sessionManager.createSession(any(SchemeConfig.class))).thenReturn(SESSION_ID);
    List<String> fibValues = SchemeType.resolveValues("fibonacci", null, true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(fibValues);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    final SessionResponse response = gameController.createSession(request);
    assertEquals(SESSION_ID, response.sessionId());
    assertEquals("fibonacci", response.schemeType());
    assertTrue(response.values().contains("1"));
    assertTrue(response.values().contains("?"));
    assertTrue(response.includeUnsure());
    assertEquals(USER_NAME, response.host());
    inOrder.verify(sessionManager, times(1)).createSession(any(SchemeConfig.class));
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
    verify(sessionManager).getSessionLegalValues(SESSION_ID);
  }

  @Test
  void testCreateSessionWithTshirtScheme() {
    CreateSessionRequest request = new CreateSessionRequest(USER_NAME, "tshirt", null, true);
    when(sessionManager.createSession(any(SchemeConfig.class))).thenReturn(SESSION_ID);
    List<String> tshirtValues = SchemeType.resolveValues("tshirt", null, true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(tshirtValues);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    final SessionResponse response = gameController.createSession(request);
    assertEquals(SESSION_ID, response.sessionId());
    assertEquals("tshirt", response.schemeType());
    assertTrue(response.values().contains("XS"));
    assertTrue(response.values().contains("?"));
    assertTrue(response.includeUnsure());
    assertEquals(USER_NAME, response.host());
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
    verify(messagingUtils).sendResetNotification(SESSION_ID);
    verify(messagingUtils).burstResultsMessages(SESSION_ID);
  }

  @Test
  void testResetNonMemberRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
    assertThrows(IllegalArgumentException.class, () -> gameController.reset(SESSION_ID, USER_NAME));
  }

  @Test
  void testCreateSessionRejectsShortName() {
    CreateSessionRequest request = new CreateSessionRequest("AB", null, null, null);
    assertThrows(IllegalArgumentException.class, () -> gameController.createSession(request));
  }

  @Test
  void testCreateSessionRejectsInvalidChars() {
    CreateSessionRequest request = new CreateSessionRequest("<script>", null, null, null);
    assertThrows(IllegalArgumentException.class, () -> gameController.createSession(request));
  }

  @Test
  void testKickUser() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("Rich", "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    gameController.kickUser("Rich", "Alice", SESSION_ID);
    verify(sessionManager, times(1)).removeUser("Alice", SESSION_ID);
    verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
    verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
  }

  @Test
  void testKickUserNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("Rich", "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    assertThrows(
        HostActionException.class, () -> gameController.kickUser("Alice", "Rich", SESSION_ID));
  }

  @Test
  void testKickUserTargetNotInSession() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList("Rich"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    assertThrows(
        IllegalArgumentException.class, () -> gameController.kickUser("Rich", "Bob", SESSION_ID));
  }

  @Test
  void testKickUserCannotKickSelf() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList("Rich"));
    assertThrows(
        IllegalArgumentException.class, () -> gameController.kickUser("Rich", "Rich", SESSION_ID));
  }

  @Test
  void testPromoteUser() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("Rich", "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    gameController.promoteUser("Rich", "Alice", SESSION_ID);
    verify(sessionManager, times(1)).promoteHost(SESSION_ID, "Alice");
    verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
    verify(messagingUtils, never()).burstResultsMessages(SESSION_ID);
  }

  @Test
  void testPromoteUserNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("Rich", "Alice", "Bob"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    assertThrows(
        HostActionException.class, () -> gameController.promoteUser("Alice", "Bob", SESSION_ID));
  }

  @Test
  void testPromoteUserCannotPromoteSelf() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList("Rich"));
    assertThrows(
        IllegalArgumentException.class,
        () -> gameController.promoteUser("Rich", "Rich", SESSION_ID));
  }

  @Test
  void testSetLabel() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    gameController.setLabel(SESSION_ID, USER_NAME, "Login page redesign");
    verify(sessionManager).setLabel(SESSION_ID, "Login page redesign");
    verify(messagingUtils).burstResultsMessages(SESSION_ID);
  }

  @Test
  void testSetLabelNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");
    assertThrows(
        HostActionException.class, () -> gameController.setLabel(SESSION_ID, USER_NAME, "label"));
  }

  @Test
  void testSetLabelTooLongRejected() {
    String tooLong = "a".repeat(101);
    assertThrows(
        IllegalArgumentException.class,
        () -> gameController.setLabel(SESSION_ID, USER_NAME, tooLong));
  }

  @Test
  void testSetLabelEmptyAllowed() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    gameController.setLabel(SESSION_ID, USER_NAME, "");
    verify(sessionManager).setLabel(SESSION_ID, "");
    verify(messagingUtils).burstResultsMessages(SESSION_ID);
  }

  @Test
  void testResetClearsLabel() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    gameController.reset(SESSION_ID, USER_NAME);
    verify(sessionManager).resetSession(SESSION_ID);
    verify(messagingUtils).sendResetNotification(SESSION_ID);
    verify(messagingUtils).burstResultsMessages(SESSION_ID);
  }
}
