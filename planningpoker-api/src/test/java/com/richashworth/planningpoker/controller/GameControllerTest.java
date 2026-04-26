package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.RefreshResponse;
import com.richashworth.planningpoker.model.ResetResponse;
import com.richashworth.planningpoker.model.Round;
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
    when(sessionManager.getRound(SESSION_ID)).thenReturn(4);
    List<Estimate> existing = List.of(new Estimate("HostUser", "5"));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(existing);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("Sprint 2");
    List<Round> priorRounds =
        List.of(
            new Round(
                3, "Story A", "5", List.of(new Estimate("HostUser", "5")), "2026-04-21T10:00:00Z"));
    when(sessionManager.getCompletedRounds(SESSION_ID)).thenReturn(priorRounds);
    SessionResponse response = gameController.joinSession(SESSION_ID, USER_NAME);
    assertEquals("fibonacci", response.schemeType());
    assertTrue(response.values().contains("1"));
    assertTrue(response.values().contains("?"));
    assertTrue(response.includeUnsure());
    assertEquals("HostUser", response.host());
    assertEquals(4, response.round());
    assertEquals(existing, response.results());
    assertEquals("Sprint 2", response.label());
    assertEquals(priorRounds, response.completedRounds());
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
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
    when(sessionManager.getRound(SESSION_ID)).thenReturn(0);
    final SessionResponse response = gameController.createSession(request);
    assertEquals(SESSION_ID, response.sessionId());
    assertEquals("fibonacci", response.schemeType());
    assertTrue(response.values().contains("1"));
    assertTrue(response.values().contains("?"));
    assertTrue(response.includeUnsure());
    assertEquals(USER_NAME, response.host());
    assertEquals(0, response.round());
    assertTrue(response.results().isEmpty());
    assertEquals("", response.label());
    assertTrue(response.completedRounds().isEmpty());
    inOrder.verify(sessionManager, times(1)).createSession(any(SchemeConfig.class));
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(sessionManager).getSessionLegalValues(SESSION_ID);
  }

  @Test
  void testCreateSessionWithTshirtScheme() {
    CreateSessionRequest request = new CreateSessionRequest(USER_NAME, "tshirt", null, true);
    when(sessionManager.createSession(any(SchemeConfig.class))).thenReturn(SESSION_ID);
    List<String> tshirtValues = SchemeType.resolveValues("tshirt", null, true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(tshirtValues);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    when(sessionManager.getRound(SESSION_ID)).thenReturn(0);
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
    when(sessionManager.getRound(SESSION_ID)).thenReturn(2);
    List<Estimate> results = List.of(new Estimate("Alice", "5"));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(results);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("Sprint");
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(List.of("Alice", "Bob"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");
    List<Round> priorRounds =
        List.of(
            new Round(
                1, "Story A", "3", List.of(new Estimate("Alice", "3")), "2026-04-21T10:00:00Z"));
    when(sessionManager.getCompletedRounds(SESSION_ID)).thenReturn(priorRounds);
    RefreshResponse response = gameController.refresh(SESSION_ID);
    assertEquals(2, response.round());
    assertEquals(results, response.results());
    assertEquals("Sprint", response.label());
    assertEquals(List.of("Alice", "Bob"), response.users());
    assertEquals("Alice", response.host());
    assertEquals(priorRounds, response.completedRounds());
    verify(messagingUtils).sendResultsMessage(SESSION_ID);
    verify(messagingUtils).sendUsersMessage(SESSION_ID);
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
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    gameController.leaveSession(USER_NAME, SESSION_ID);
    verify(sessionManager, times(1)).removeUser(USER_NAME, SESSION_ID);
    verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(messagingUtils, never()).sendUserLeftMessage(anyString(), anyString());
  }

  @Test
  void testLeaveSessionWithVoteEmitsUserLeft() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of(new Estimate(USER_NAME, "5")));
    gameController.leaveSession(USER_NAME, SESSION_ID);
    verify(sessionManager, times(1)).removeUser(USER_NAME, SESSION_ID);
    verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(messagingUtils, times(1)).sendUserLeftMessage(SESSION_ID, USER_NAME);
  }

  @Test
  void testReset() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(4);
    ResetResponse response = gameController.reset(SESSION_ID, USER_NAME, null);
    assertEquals(4, response.round());
    verify(sessionManager).resetSession(SESSION_ID);
    verify(sessionManager).incrementAndGetRound(SESSION_ID);
    verify(messagingUtils).sendResetMessage(SESSION_ID, 4);
    verify(messagingUtils, never()).sendRoundCompletedMessage(anyString(), any(Round.class));
    verify(messagingUtils, never()).sendResultsMessage(anyString());
  }

  @Test
  void testResetWithVotesBroadcastsRoundCompleted() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    List<Estimate> votes =
        List.of(new Estimate("Alice", "5"), new Estimate("Bob", "5"), new Estimate("Carol", "3"));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(votes);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("Login page");
    when(sessionManager.getRound(SESSION_ID)).thenReturn(2);
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(3);

    ResetResponse response = gameController.reset(SESSION_ID, USER_NAME, "8");

    assertEquals(3, response.round());
    org.mockito.ArgumentCaptor<Round> captor = org.mockito.ArgumentCaptor.forClass(Round.class);
    verify(sessionManager).appendCompletedRound(eq(SESSION_ID), captor.capture());
    Round stored = captor.getValue();
    assertEquals(2, stored.round());
    assertEquals("Login page", stored.label());
    assertEquals("8", stored.consensus()); // explicit override preferred over mode
    assertEquals(votes, stored.votes());
    assertNotNull(stored.timestamp());
    verify(messagingUtils).sendRoundCompletedMessage(SESSION_ID, stored);
    verify(messagingUtils).sendResetMessage(SESSION_ID, 3);
  }

  @Test
  void testResetWithoutConsensusFallsBackToMode() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    // Two "5"s and one "3" → mode is "5"
    List<Estimate> votes =
        List.of(new Estimate("Alice", "5"), new Estimate("Bob", "5"), new Estimate("Carol", "3"));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(votes);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    when(sessionManager.getRound(SESSION_ID)).thenReturn(0);
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(1);

    gameController.reset(SESSION_ID, USER_NAME, null);

    org.mockito.ArgumentCaptor<Round> captor = org.mockito.ArgumentCaptor.forClass(Round.class);
    verify(sessionManager).appendCompletedRound(eq(SESSION_ID), captor.capture());
    assertEquals("5", captor.getValue().consensus());
  }

  @Test
  void testResetWithTiedVotesPicksAlphabeticallyFirstMode() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    // Tie: one "3" and one "5" → alphabetically first → "3"
    List<Estimate> votes = List.of(new Estimate("Alice", "5"), new Estimate("Bob", "3"));
    when(sessionManager.getResults(SESSION_ID)).thenReturn(votes);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    when(sessionManager.getRound(SESSION_ID)).thenReturn(0);
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(1);

    gameController.reset(SESSION_ID, USER_NAME, "");

    org.mockito.ArgumentCaptor<Round> captor = org.mockito.ArgumentCaptor.forClass(Round.class);
    verify(sessionManager).appendCompletedRound(eq(SESSION_ID), captor.capture());
    assertEquals("3", captor.getValue().consensus());
  }

  @Test
  void testResetNonMemberRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
    assertThrows(
        IllegalArgumentException.class, () -> gameController.reset(SESSION_ID, USER_NAME, null));
  }

  @Test
  void testResetNonHostRejected() {
    // Issue #110: only the host may trigger a reset; a non-host session member must be rejected
    // with HostActionException (mapped to HTTP 403 by ErrorHandler).
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");
    assertThrows(
        HostActionException.class, () -> gameController.reset(SESSION_ID, USER_NAME, null));
    verify(sessionManager, never()).resetSession(anyString());
    verify(sessionManager, never()).incrementAndGetRound(anyString());
    verify(messagingUtils, never()).sendResetMessage(anyString(), anyInt());
    verify(messagingUtils, never()).sendRoundCompletedMessage(anyString(), any(Round.class));
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
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    gameController.kickUser("Rich", "Alice", SESSION_ID);
    verify(sessionManager, times(1)).removeUser("Alice", SESSION_ID);
    verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(messagingUtils, never()).sendUserLeftMessage(anyString(), anyString());
  }

  @Test
  void testKickUserWithVoteEmitsUserLeft() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("Rich", "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich");
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of(new Estimate("Alice", "5")));
    gameController.kickUser("Rich", "Alice", SESSION_ID);
    verify(sessionManager, times(1)).removeUser("Alice", SESSION_ID);
    verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(messagingUtils, times(1)).sendUserLeftMessage(SESSION_ID, "Alice");
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
    verify(messagingUtils, times(1)).sendUsersMessage(SESSION_ID);
    verify(messagingUtils, never()).sendResultsMessage(anyString());
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
    verify(messagingUtils).sendResultsMessage(SESSION_ID);
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
    verify(messagingUtils).sendResultsMessage(SESSION_ID);
  }

  @Test
  void testResetClearsLabel() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(1);
    gameController.reset(SESSION_ID, USER_NAME, null);
    verify(sessionManager).resetSession(SESSION_ID);
    verify(messagingUtils).sendResetMessage(SESSION_ID, 1);
  }

  @Test
  void testSetConsensusByHost() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    gameController.setConsensus(SESSION_ID, USER_NAME, "8");
    verify(sessionManager).setConsensusOverride(SESSION_ID, "8");
    verify(messagingUtils).sendConsensusMessage(SESSION_ID);
  }

  @Test
  void testSetConsensusBlankClearsOverride() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    gameController.setConsensus(SESSION_ID, USER_NAME, "");
    verify(sessionManager).setConsensusOverride(SESSION_ID, null);
    verify(messagingUtils).sendConsensusMessage(SESSION_ID);
  }

  @Test
  void testSetConsensusNullClearsOverride() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    gameController.setConsensus(SESSION_ID, USER_NAME, null);
    verify(sessionManager).setConsensusOverride(SESSION_ID, null);
    verify(messagingUtils).sendConsensusMessage(SESSION_ID);
  }

  @Test
  void testSetConsensusNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");
    assertThrows(
        HostActionException.class, () -> gameController.setConsensus(SESSION_ID, USER_NAME, "5"));
    verify(sessionManager, never()).setConsensusOverride(anyString(), any());
    verify(messagingUtils, never()).sendConsensusMessage(anyString());
  }

  @Test
  void testSetConsensusNonMemberRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
    assertThrows(
        IllegalArgumentException.class,
        () -> gameController.setConsensus(SESSION_ID, USER_NAME, "5"));
    verify(sessionManager, never()).setConsensusOverride(anyString(), any());
  }

  @Test
  void testSetConsensusInactiveSessionRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
    assertThrows(
        IllegalArgumentException.class,
        () -> gameController.setConsensus(SESSION_ID, USER_NAME, "5"));
    verify(sessionManager, never()).setConsensusOverride(anyString(), any());
  }

  @Test
  void testResetClearsConsensusAndBroadcasts() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(2);
    gameController.reset(SESSION_ID, USER_NAME, null);
    verify(sessionManager).setConsensusOverride(SESSION_ID, null);
    verify(messagingUtils).sendConsensusMessage(SESSION_ID);
  }

  @Test
  void testRefreshBroadcastsConsensus() {
    when(sessionManager.getRound(SESSION_ID)).thenReturn(1);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(List.of("Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");
    when(sessionManager.getCompletedRounds(SESSION_ID)).thenReturn(List.of());
    gameController.refresh(SESSION_ID);
    verify(messagingUtils).sendConsensusMessage(SESSION_ID);
  }
}
