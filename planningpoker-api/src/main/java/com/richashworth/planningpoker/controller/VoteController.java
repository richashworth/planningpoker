package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.CollectionUtils;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VoteController {

  private final Logger logger = LoggerFactory.getLogger(getClass());
  private final SessionManager sessionManager;
  private final MessagingUtils messagingUtils;

  public VoteController(SessionManager sessionManager, MessagingUtils messagingUtils) {
    this.sessionManager = sessionManager;
    this.messagingUtils = messagingUtils;
  }

  @PostMapping("vote")
  public void vote(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "estimateValue") final String estimateValue) {
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    if (!legalValues.contains(estimateValue)) {
      throw new IllegalArgumentException("Invalid estimate value");
    }
    synchronized (sessionManager) {
      if (!sessionManager.isSessionActive(sessionId)) {
        throw new IllegalArgumentException("Session not active");
      }
      if (!CollectionUtils.containsIgnoreCase(
          sessionManager.getSessionUsers(sessionId), userName)) {
        throw new IllegalArgumentException("User is not a member of this session");
      }
      logger.info("{} has voted {} in session {}", userName, estimateValue, sessionId);
      if (!CollectionUtils.containsUserEstimate(sessionManager.getResults(sessionId), userName)) {
        final Estimate estimate = new Estimate(userName, estimateValue);
        sessionManager.registerEstimate(sessionId, estimate);
      }
    }
    messagingUtils.burstResultsMessages(sessionId);
  }
}
