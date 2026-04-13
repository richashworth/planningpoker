package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.USER_NAME;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.common.collect.Lists;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

class TimerControllerTest extends AbstractControllerTest {

  @InjectMocks private TimerController timerController;

  // --- configure ---

  @Test
  void testConfigure() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);

    timerController.configure(SESSION_ID, USER_NAME, true, 60);

    verify(sessionManager).configureTimer(SESSION_ID, true, 60);
    verify(messagingUtils).sendTimerMessage(SESSION_ID);
  }

  @Test
  void testConfigureNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");

    assertThrows(
        HostActionException.class,
        () -> timerController.configure(SESSION_ID, USER_NAME, true, 60));
    verify(messagingUtils, never()).sendTimerMessage(any());
  }

  @Test
  void testConfigureUnknownSessionRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);

    assertThrows(
        IllegalArgumentException.class,
        () -> timerController.configure(SESSION_ID, USER_NAME, true, 60));
  }

  @Test
  void testConfigureNonMemberRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList("Alice"));

    assertThrows(
        IllegalArgumentException.class,
        () -> timerController.configure(SESSION_ID, USER_NAME, true, 60));
  }

  // --- start ---

  @Test
  void testStart() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);

    timerController.start(SESSION_ID, USER_NAME);

    verify(sessionManager).startTimer(SESSION_ID);
    verify(messagingUtils).sendTimerMessage(SESSION_ID);
  }

  @Test
  void testStartNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");

    assertThrows(HostActionException.class, () -> timerController.start(SESSION_ID, USER_NAME));
    verify(messagingUtils, never()).sendTimerMessage(any());
  }

  @Test
  void testStartUnknownSessionRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);

    assertThrows(
        IllegalArgumentException.class, () -> timerController.start(SESSION_ID, USER_NAME));
  }

  // --- pause ---

  @Test
  void testPause() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);

    timerController.pause(SESSION_ID, USER_NAME);

    verify(sessionManager).pauseTimer(SESSION_ID);
    verify(messagingUtils).sendTimerMessage(SESSION_ID);
  }

  @Test
  void testPauseNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");

    assertThrows(HostActionException.class, () -> timerController.pause(SESSION_ID, USER_NAME));
  }

  // --- resume ---

  @Test
  void testResume() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);

    timerController.resume(SESSION_ID, USER_NAME);

    verify(sessionManager).resumeTimer(SESSION_ID);
    verify(messagingUtils).sendTimerMessage(SESSION_ID);
  }

  @Test
  void testResumeNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");

    assertThrows(HostActionException.class, () -> timerController.resume(SESSION_ID, USER_NAME));
  }

  // --- reset ---

  @Test
  void testReset() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);

    timerController.reset(SESSION_ID, USER_NAME);

    verify(sessionManager).resetTimerRuntime(SESSION_ID);
    verify(messagingUtils).sendTimerMessage(SESSION_ID);
  }

  @Test
  void testResetNonHostRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList(USER_NAME, "Alice"));
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice");

    assertThrows(HostActionException.class, () -> timerController.reset(SESSION_ID, USER_NAME));
  }

  @Test
  void testResetUnknownSessionRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);

    assertThrows(
        IllegalArgumentException.class, () -> timerController.reset(SESSION_ID, USER_NAME));
  }
}
