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
    // Re-read server state on every iteration so a late message from an
    // earlier burst can never deliver a stale snapshot that overwrites a
    // fresher vote on the client. See specs/BurstRace.tla.
    for (final long LATENCY_DURATION : LATENCIES) {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("results", sessionManager.getResults(sessionId));
      payload.put("label", sessionManager.getLabel(sessionId));
      template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId), resultsMessage(payload));
      clock.pause(LATENCY_DURATION);
    }
  }

  @Async
  public void burstUsersMessages(String sessionId) {
    // Capture snapshot once before burst loop so all iterations send identical data
    Map<String, Object> snapshot = new LinkedHashMap<>();
    snapshot.put("users", sessionManager.getSessionUsers(sessionId));
    snapshot.put("host", sessionManager.getHost(sessionId));
    Object message = usersMessage(snapshot);
    for (final long LATENCY_DURATION : LATENCIES) {
      template.convertAndSend(getTopic(TOPIC_USERS, sessionId), message);
      clock.pause(LATENCY_DURATION);
    }
  }

  @Async
  public void sendResetNotification(String sessionId) {
    Object message = new Message(MessageType.RESET_MESSAGE, Map.of());
    for (final long LATENCY_DURATION : LATENCIES) {
      template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId), message);
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
    RESULTS_MESSAGE,
    RESET_MESSAGE
  }

  private record Message(MessageType type, Object payload) {}
}
