package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;

import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SessionResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.LogSafeIds;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController {

  private static final int MAX_USERNAME_LENGTH = 20;
  private static final int MIN_USERNAME_LENGTH = 3;
  private static final String USERNAME_PATTERN = "^[a-zA-Z0-9 _-]+$";

  private final Logger logger = LoggerFactory.getLogger(getClass());
  private final SessionManager sessionManager;
  private final MessagingUtils messagingUtils;

  public GameController(SessionManager sessionManager, MessagingUtils messagingUtils) {
    this.sessionManager = sessionManager;
    this.messagingUtils = messagingUtils;
  }

  @PostMapping("joinSession")
  public SessionResponse joinSession(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    validateUserName(userName);
    synchronized (sessionManager) {
      if (!sessionManager.isSessionActive(sessionId)) {
        throw new IllegalArgumentException("session not found");
      } else if (containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
        throw new IllegalArgumentException("user exists");
      } else {
        sessionManager.registerUser(userName, sessionId);
        logger.info(
            "user {} joined session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
      }
    }
    messagingUtils.burstUsersMessages(sessionId);
    SchemeConfig config = sessionManager.getSessionSchemeConfig(sessionId);
    List<String> values = sessionManager.getSessionLegalValues(sessionId);
    String host = sessionManager.getHost(sessionId);
    return new SessionResponse(
        host,
        null,
        config.schemeType(),
        values,
        config.includeUnsure(),
        sessionManager.getTimerState(sessionId));
  }

  @PostMapping("createSession")
  public SessionResponse createSession(@RequestBody CreateSessionRequest request) {
    validateUserName(request.userName());
    final String sessionId;
    final SchemeConfig schemeConfig = buildSchemeConfig(request);
    boolean timerEnabled = request.timerEnabled() != null && request.timerEnabled();
    int timerDefaultSeconds =
        request.timerDefaultSeconds() != null ? request.timerDefaultSeconds() : 60;
    synchronized (sessionManager) {
      sessionId = sessionManager.createSession(schemeConfig, timerEnabled, timerDefaultSeconds);
      sessionManager.registerUser(request.userName(), sessionId);
      logger.info(
          "user {} created session {}",
          LogSafeIds.hash(request.userName()),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.burstUsersMessages(sessionId);
    List<String> values = sessionManager.getSessionLegalValues(sessionId);
    String host = sessionManager.getHost(sessionId);
    return new SessionResponse(
        host,
        sessionId,
        schemeConfig.schemeType(),
        values,
        schemeConfig.includeUnsure(),
        sessionManager.getTimerState(sessionId));
  }

  @PostMapping("logout")
  public void leaveSession(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "sessionId") final String sessionId) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      sessionManager.removeUser(userName, sessionId);
      logger.info("user {} left session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
    }
    messagingUtils.burstUsersMessages(sessionId);
    messagingUtils.burstResultsMessages(sessionId);
  }

  @GetMapping("refresh")
  public void refresh(@RequestParam(name = "sessionId") final String sessionId) {
    messagingUtils.sendResultsMessage(sessionId);
    messagingUtils.sendUsersMessage(sessionId);
  }

  @GetMapping("sessionUsers")
  public List<String> getSessionUsers(@RequestParam(name = "sessionId") final String sessionId) {
    return sessionManager.getSessionUsers(sessionId);
  }

  @PostMapping("kick")
  public void kickUser(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "targetUser") final String targetUser,
      @RequestParam(name = "sessionId") final String sessionId) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (userName.equalsIgnoreCase(targetUser)) {
        throw new IllegalArgumentException("cannot kick yourself");
      }
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      if (!containsIgnoreCase(sessionManager.getSessionUsers(sessionId), targetUser)) {
        throw new IllegalArgumentException("target user is not a member of this session");
      }
      sessionManager.removeUser(targetUser, sessionId);
      logger.info(
          "host {} kicked user {} from session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(targetUser),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.burstUsersMessages(sessionId);
    messagingUtils.burstResultsMessages(sessionId);
  }

  @PostMapping("promote")
  public void promoteUser(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "targetUser") final String targetUser,
      @RequestParam(name = "sessionId") final String sessionId) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (userName.equalsIgnoreCase(targetUser)) {
        throw new IllegalArgumentException("cannot promote yourself");
      }
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.promoteHost(sessionId, targetUser);
      logger.info(
          "host {} promoted user {} in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(targetUser),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.burstUsersMessages(sessionId);
  }

  @PostMapping("reset")
  public void reset(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      logger.info(
          "host {} reset session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
      sessionManager.resetSession(sessionId);
    }
    messagingUtils.sendResetNotification(sessionId);
    messagingUtils.burstResultsMessages(sessionId);
    messagingUtils.sendTimerMessage(sessionId);
  }

  @PostMapping("setLabel")
  public void setLabel(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "label") final String label) {
    if (label != null && label.length() > 100) {
      throw new IllegalArgumentException("label must not exceed 100 characters");
    }
    String sanitized = label == null ? "" : label.replaceAll("[\\p{Cntrl}]", "");
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.setLabel(sessionId, sanitized);
      logger.debug(
          "host {} set label in session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
    }
    messagingUtils.burstResultsMessages(sessionId);
  }

  private SchemeConfig buildSchemeConfig(CreateSessionRequest request) {
    String schemeType = request.schemeType() != null ? request.schemeType() : "fibonacci";
    boolean includeUnsure = request.includeUnsure() != null ? request.includeUnsure() : true;
    List<String> customValues = null;
    if (request.customValues() != null && !request.customValues().isBlank()) {
      customValues = List.of(request.customValues().split(","));
    }
    return new SchemeConfig(schemeType, customValues, includeUnsure);
  }

  private void validateUserName(String userName) {
    if (userName == null
        || userName.length() < MIN_USERNAME_LENGTH
        || userName.length() > MAX_USERNAME_LENGTH) {
      throw new IllegalArgumentException(
          "username must be between "
              + MIN_USERNAME_LENGTH
              + " and "
              + MAX_USERNAME_LENGTH
              + " characters");
    }
    if (!userName.matches(USERNAME_PATTERN)) {
      throw new IllegalArgumentException("username contains invalid characters");
    }
  }

  private void validateSessionMembership(String sessionId, String userName) {
    if (!sessionManager.isSessionActive(sessionId)) {
      throw new IllegalArgumentException("session not found");
    }
    if (!containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
      throw new IllegalArgumentException("user is not a member of this session");
    }
  }
}
