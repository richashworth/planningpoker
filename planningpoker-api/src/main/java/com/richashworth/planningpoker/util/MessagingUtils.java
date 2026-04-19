package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import java.util.LinkedHashMap;
import java.util.Map;
import org.jetbrains.annotations.Contract;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class MessagingUtils {

  public static final String TOPIC_RESULTS = "/topic/results/";
  public static final String TOPIC_USERS = "/topic/users/";

  private final SessionManager sessionManager;
  private final SimpMessagingTemplate template;

  public MessagingUtils(SessionManager sessionManager, SimpMessagingTemplate template) {
    this.sessionManager = sessionManager;
    this.template = template;
  }

  @Contract(pure = true)
  public static String getTopic(String topicRoot, String sessionId) {
    return topicRoot + sessionId;
  }

  public void sendResultsMessage(String sessionId) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("round", sessionManager.getRound(sessionId));
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

  public void sendResetMessage(String sessionId, int round) {
    template.convertAndSend(
        getTopic(TOPIC_RESULTS, sessionId),
        new Message(MessageType.RESET_MESSAGE, Map.of("round", round)));
  }

  public void sendUserLeftMessage(String sessionId, String leaver) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("round", sessionManager.getRound(sessionId));
    payload.put("leaver", leaver);
    template.convertAndSend(
        getTopic(TOPIC_RESULTS, sessionId), new Message(MessageType.USER_LEFT_MESSAGE, payload));
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
    RESET_MESSAGE,
    USER_LEFT_MESSAGE
  }

  private record Message(MessageType type, Object payload) {}
}
