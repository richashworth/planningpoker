package com.richashworth.planningpoker.util;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static com.richashworth.planningpoker.util.Clock.LATENCIES;
import static com.richashworth.planningpoker.util.MessagingUtils.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.richashworth.planningpoker.service.SessionManager;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MessagingUtilsTest {

  @InjectMocks private MessagingUtils messagingUtils;

  @Mock private Clock clock;

  @Mock private SessionManager sessionManager;

  @Mock private SimpMessagingTemplate template;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(messagingUtils, "clock", clock);
    ReflectionTestUtils.setField(messagingUtils, "template", template);
  }

  @Test
  void testGetTopic() {
    final String result = MessagingUtils.getTopic("/topic/root/", "abc123");
    assertEquals("/topic/root/abc123", result);
  }

  @Test
  void testSendResultsMessage() {
    when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    messagingUtils.sendResultsMessage(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("results", RESULTS);
    expectedPayload.put("label", "");
    verifyMessageSent(
        1, getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(expectedPayload));
  }

  @Test
  void testSendUsersMessage() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    messagingUtils.sendUsersMessage(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", USER_NAME);
    verifyMessageSent(
        1, getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage(expectedPayload));
  }

  @Test
  void testSendUsersMessageIncludesHost() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn("HostUser");
    messagingUtils.sendUsersMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template).convertAndSend(eq(getTopic(TOPIC_USERS, SESSION_ID)), captor.capture());
    Object sent = captor.getValue();
    // The Message object wraps the payload; extract payload via toString or cast
    // Since Message is package-private, use usersMessage helper to compare structure
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", "HostUser");
    assertEquals(messagingUtils.usersMessage(expectedPayload), sent);
  }

  @Test
  void testSendUsersMessageWithNullHost() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(null);
    // Should not throw NPE
    messagingUtils.sendUsersMessage(SESSION_ID);
    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template).convertAndSend(eq(getTopic(TOPIC_USERS, SESSION_ID)), captor.capture());
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", null);
    assertEquals(messagingUtils.usersMessage(expectedPayload), captor.getValue());
  }

  @Test
  void testBurstResultsMessages() {
    when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("");
    messagingUtils.burstResultsMessages(SESSION_ID);
    for (long latency : LATENCIES) {
      verify(clock, times(1)).pause(latency);
    }
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("results", RESULTS);
    expectedPayload.put("label", "");
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_RESULTS, SESSION_ID),
        messagingUtils.resultsMessage(expectedPayload));
  }

  @Test
  void testBurstUsersMessages() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    messagingUtils.burstUsersMessages(SESSION_ID);
    for (long latency : LATENCIES) {
      verify(clock, times(1)).pause(latency);
    }
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", USER_NAME);
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_USERS, SESSION_ID),
        messagingUtils.usersMessage(expectedPayload));
  }

  private void verifyMessageSent(int numberInvocations, String destination, Object payload) {
    verify(template, times(numberInvocations)).convertAndSend(destination, payload);
  }
}
