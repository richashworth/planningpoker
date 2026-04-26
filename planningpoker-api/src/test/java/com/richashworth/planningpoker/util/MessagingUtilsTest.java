package com.richashworth.planningpoker.util;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static com.richashworth.planningpoker.util.MessagingUtils.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.Round;
import com.richashworth.planningpoker.service.SessionManager;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class MessagingUtilsTest {

  @InjectMocks private MessagingUtils messagingUtils;

  @Mock private SessionManager sessionManager;

  @Mock private SimpMessagingTemplate template;

  @Test
  void testGetTopic() {
    final String result = MessagingUtils.getTopic("/topic/root/", "abc123");
    assertEquals("/topic/root/abc123", result);
  }

  @Test
  void testSendResultsMessageIncludesRound() {
    when(sessionManager.getRound(SESSION_ID)).thenReturn(3);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("Sprint 1");
    messagingUtils.sendResultsMessage(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("round", 3);
    expectedPayload.put("results", RESULTS);
    expectedPayload.put("label", "Sprint 1");
    verify(template, times(1))
        .convertAndSend(
            getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(expectedPayload));
    verifyNoMoreInteractions(template);
  }

  @Test
  void testSendUsersMessage() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    messagingUtils.sendUsersMessage(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", USER_NAME);
    verify(template, times(1))
        .convertAndSend(
            getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage(expectedPayload));
    verifyNoMoreInteractions(template);
  }

  @Test
  void testSendUsersMessageIncludesHost() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn("HostUser");
    messagingUtils.sendUsersMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template).convertAndSend(eq(getTopic(TOPIC_USERS, SESSION_ID)), captor.capture());
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", "HostUser");
    assertEquals(messagingUtils.usersMessage(expectedPayload), captor.getValue());
  }

  @Test
  void testSendUsersMessageWithNullHost() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(null);
    messagingUtils.sendUsersMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template).convertAndSend(eq(getTopic(TOPIC_USERS, SESSION_ID)), captor.capture());
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", null);
    assertEquals(messagingUtils.usersMessage(expectedPayload), captor.getValue());
  }

  @Test
  void testSendResetMessageEmitsOnce() {
    messagingUtils.sendResetMessage(SESSION_ID, 7);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), captor.capture());
    verifyNoMoreInteractions(template);
    // Reflective check: payload is a Message record with type RESET_MESSAGE and {"round": 7}
    Object sent = captor.getValue();
    String str = sent.toString();
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("RESET_MESSAGE"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("round=7"), str);
  }

  @Test
  void testSendUserLeftMessageEmitsOnce() {
    when(sessionManager.getRound(SESSION_ID)).thenReturn(2);
    messagingUtils.sendUserLeftMessage(SESSION_ID, "Alice");
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), captor.capture());
    verifyNoMoreInteractions(template);
    Object sent = captor.getValue();
    String str = sent.toString();
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("USER_LEFT_MESSAGE"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("round=2"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("leaver=Alice"), str);
  }

  @Test
  void testSendResultsMessageEmitsExactlyOnce() {
    when(sessionManager.getRound(SESSION_ID)).thenReturn(1);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    messagingUtils.sendResultsMessage(SESSION_ID);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), (Object) any());
    verifyNoMoreInteractions(template);
  }

  @Test
  void testSendConsensusMessageEmitsOnce() {
    when(sessionManager.getConsensusOverride(SESSION_ID)).thenReturn("8");
    when(sessionManager.getConsensusRound(SESSION_ID)).thenReturn(3L);
    messagingUtils.sendConsensusMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_CONSENSUS, SESSION_ID)), captor.capture());
    verifyNoMoreInteractions(template);
    String str = captor.getValue().toString();
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("CONSENSUS_OVERRIDE_MESSAGE"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("value=8"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("round=3"), str);
  }

  @Test
  void testSendConsensusMessageWithNullValue() {
    when(sessionManager.getConsensusOverride(SESSION_ID)).thenReturn(null);
    when(sessionManager.getConsensusRound(SESSION_ID)).thenReturn(7L);
    messagingUtils.sendConsensusMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_CONSENSUS, SESSION_ID)), captor.capture());
    String str = captor.getValue().toString();
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("CONSENSUS_OVERRIDE_MESSAGE"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("value=null"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("round=7"), str);
  }

  @Test
  void testSendRoundCompletedMessageEmitsOnce() {
    Round round =
        new Round(
            3,
            "Login page",
            "5",
            List.of(new Estimate("Alice", "5"), new Estimate("Bob", "5")),
            "2026-04-21T10:00:00Z");
    messagingUtils.sendRoundCompletedMessage(SESSION_ID, round);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, times(1))
        .convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), captor.capture());
    verifyNoMoreInteractions(template);
    String str = captor.getValue().toString();
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("ROUND_COMPLETED_MESSAGE"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("round=3"), str);
    org.junit.jupiter.api.Assertions.assertTrue(str.contains("consensus=5"), str);
  }
}
