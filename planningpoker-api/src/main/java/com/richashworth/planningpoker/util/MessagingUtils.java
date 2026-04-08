package com.richashworth.planningpoker.util;

import static com.richashworth.planningpoker.util.Clock.LATENCIES;

import com.richashworth.planningpoker.service.SessionManager;
import java.util.LinkedHashMap;
import java.util.Map;
import org.jetbrains.annotations.Contract;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class MessagingUtils {

  public static final String TOPIC_RESULTS = "/topic/results/";
  public static final String TOPIC_USERS = "/topic/users/";

  private final SessionManager sessionManager;
  private final Clock clock;
  private final SimpMessagingTemplate template;

  public MessagingUtils(
      SessionManager sessionManager, Clock clock, SimpMessagingTemplate template) {
    this.sessionManager = sessionManager;
    this.clock = clock;
    this.template = template;
  }

  @Contract(pure = true)
  public static String getTopic(String topicRoot, String sessionId) {
    return topicRoot + sessionId;
  }

  public void sendResultsMessage(String sessionId) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("results", sessionManager.getResults(sessionId));
    payload.put("label", sessionManager.getLabel(sessionId));
    template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId), resultsMessage(payload));
  }

  public void sendUsersMessage(String sessionId) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("users", sessionManager.getSessionUsers(sessionId));
    payload.put("host", sessionManager.getHost(sessionId));
    template.convertAndSend(getTopic(TOPIC_USERS, sessionId), usersMessage(payload));
  }

  @Async
  public void burstResultsMessages(String sessionId) {
    for (final long LATENCY_DURATION : LATENCIES) {
      sendResultsMessage(sessionId);
      clock.pause(LATENCY_DURATION);
    }
  }

  @Async
  public void burstUsersMessages(String sessionId) {
    for (final long LATENCY_DURATION : LATENCIES) {
      sendUsersMessage(sessionId);
      clock.pause(LATENCY_DURATION);
    }
  }

  Message resultsMessage(Object payload) {
    return new Message(MessageType.RESULTS_MESSAGE, payload);
  }

  Message usersMessage(Object payload) {
    return new Message(MessageType.USERS_MESSAGE, payload);
  }

  private enum MessageType {
    USERS_MESSAGE,
    RESULTS_MESSAGE
  }

  private record Message(MessageType type, Object payload) {}
}
