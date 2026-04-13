package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;

import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.LogSafeIds;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TimerController {

  private final Logger logger = LoggerFactory.getLogger(getClass());
  private final SessionManager sessionManager;
  private final MessagingUtils messagingUtils;

  public TimerController(SessionManager sessionManager, MessagingUtils messagingUtils) {
    this.sessionManager = sessionManager;
    this.messagingUtils = messagingUtils;
  }

  @PostMapping("timer/configure")
  public void configure(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "enabled") final boolean enabled,
      @RequestParam(name = "durationSeconds") final int durationSeconds) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.configureTimer(sessionId, enabled, durationSeconds);
      logger.info(
          "host {} configured timer in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendTimerMessage(sessionId);
  }

  @PostMapping("timer/start")
  public void start(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.startTimer(sessionId);
      logger.info(
          "host {} started timer in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendTimerMessage(sessionId);
  }

  @PostMapping("timer/pause")
  public void pause(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.pauseTimer(sessionId);
      logger.info(
          "host {} paused timer in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendTimerMessage(sessionId);
  }

  @PostMapping("timer/resume")
  public void resume(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.resumeTimer(sessionId);
      logger.info(
          "host {} resumed timer in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendTimerMessage(sessionId);
  }

  @PostMapping("timer/reset")
  public void reset(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName) {
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
      sessionManager.resetTimerRuntime(sessionId);
      logger.info(
          "host {} reset timer in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendTimerMessage(sessionId);
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
