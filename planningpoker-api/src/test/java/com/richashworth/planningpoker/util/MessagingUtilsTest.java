package com.richashworth.planningpoker.util;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static com.richashworth.planningpoker.util.Clock.LATENCIES;
import static com.richashworth.planningpoker.util.MessagingUtils.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import java.util.LinkedHashMap;
import java.util.List;
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
    // State is read exactly once (snapshot), not once per burst iteration
    verify(sessionManager, times(1)).getResults(SESSION_ID);
    verify(sessionManager, times(1)).getLabel(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("results", RESULTS);
    expectedPayload.put("label", "");
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_RESULTS, SESSION_ID),
        messagingUtils.resultsMessage(expectedPayload));
  }

  @Test
  void testSendResetNotification() {
    messagingUtils.sendResetNotification(SESSION_ID);
    verify(template).convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), (Object) any());
  }

  @Test
  void testBurstUsersMessages() {
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
    when(sessionManager.getHost(SESSION_ID)).thenReturn(USER_NAME);
    messagingUtils.burstUsersMessages(SESSION_ID);
    for (long latency : LATENCIES) {
      verify(clock, times(1)).pause(latency);
    }
    // State is read exactly once (snapshot), not once per burst iteration
    verify(sessionManager, times(1)).getSessionUsers(SESSION_ID);
    verify(sessionManager, times(1)).getHost(SESSION_ID);
    Map<String, Object> expectedPayload = new LinkedHashMap<>();
    expectedPayload.put("users", USERS);
    expectedPayload.put("host", USER_NAME);
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_USERS, SESSION_ID),
        messagingUtils.usersMessage(expectedPayload));
  }

  @Test
  void testBurstResultsMessagesSendsConsistentSnapshot() {
    // Mock getResults to return different values on successive calls
    List<Estimate> firstSnapshot = List.of(new Estimate(USER_NAME, "3"));
    List<Estimate> secondSnapshot = List.of(new Estimate(USER_NAME, "5"));
    when(sessionManager.getResults(SESSION_ID))
        .thenReturn(firstSnapshot)
        .thenReturn(secondSnapshot);
    when(sessionManager.getLabel(SESSION_ID)).thenReturn("Sprint 1").thenReturn("Sprint 2");

    messagingUtils.burstResultsMessages(SESSION_ID);

    // All burst sends should use the first snapshot only
    Map<String, Object> firstPayload = new LinkedHashMap<>();
    firstPayload.put("results", firstSnapshot);
    firstPayload.put("label", "Sprint 1");
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_RESULTS, SESSION_ID),
        messagingUtils.resultsMessage(firstPayload));

    // The second snapshot values should never be sent
    Map<String, Object> secondPayload = new LinkedHashMap<>();
    secondPayload.put("results", secondSnapshot);
    secondPayload.put("label", "Sprint 2");
    verify(template, never())
        .convertAndSend(
            getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(secondPayload));
  }

  @Test
  void testBurstUsersMessagesSendsConsistentSnapshot() {
    // Mock getSessionUsers to return different values on successive calls
    List<String> firstSnapshot = List.of("Alice");
    List<String> secondSnapshot = List.of("Alice", "Bob");
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(firstSnapshot)
        .thenReturn(secondSnapshot);
    when(sessionManager.getHost(SESSION_ID)).thenReturn("Alice").thenReturn("Bob");

    messagingUtils.burstUsersMessages(SESSION_ID);

    // All burst sends should use the first snapshot only
    Map<String, Object> firstPayload = new LinkedHashMap<>();
    firstPayload.put("users", firstSnapshot);
    firstPayload.put("host", "Alice");
    verifyMessageSent(
        LATENCIES.length,
        getTopic(TOPIC_USERS, SESSION_ID),
        messagingUtils.usersMessage(firstPayload));

    // The second snapshot values should never be sent
    Map<String, Object> secondPayload = new LinkedHashMap<>();
    secondPayload.put("users", secondSnapshot);
    secondPayload.put("host", "Bob");
    verify(template, never())
        .convertAndSend(
            getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage(secondPayload));
  }

  private void verifyMessageSent(int numberInvocations, String destination, Object payload) {
    verify(template, times(numberInvocations)).convertAndSend(destination, payload);
  }
}
