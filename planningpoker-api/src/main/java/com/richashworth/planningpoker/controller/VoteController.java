package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.VoteResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.CollectionUtils;
import com.richashworth.planningpoker.util.LogSafeIds;
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

  /**
   * Registers a vote for {@code userName} in {@code sessionId}. Re-voting is a no-op within the
   * same round; subsequent rounds are tracked via {@code SessionManager#incrementAndGetRound}.
   * Broadcasts the updated results to {@code /topic/results/{sessionId}} after the write.
   *
   * @throws IllegalArgumentException if the estimate is not in the session's legal values, the
   *     session is inactive, or the user is not a member of the session.
   */
  @PostMapping("vote")
  public VoteResponse vote(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "estimateValue") final String estimateValue) {
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    if (!legalValues.contains(estimateValue)) {
      throw new IllegalArgumentException("Invalid estimate value");
    }
    int round;
    List<Estimate> results;
    synchronized (sessionManager) {
      if (!sessionManager.isSessionActive(sessionId)) {
        throw new IllegalArgumentException("Session not active");
      }
      if (!CollectionUtils.containsIgnoreCase(
          sessionManager.getSessionUsers(sessionId), userName)) {
        throw new IllegalArgumentException("User is not a member of this session");
      }
      logger.debug(
          "user {} voted in session {} (estimate hash {})",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId),
          LogSafeIds.hash(estimateValue));
      if (!CollectionUtils.containsUserEstimate(sessionManager.getResults(sessionId), userName)) {
        final Estimate estimate = new Estimate(userName, estimateValue);
        sessionManager.registerEstimate(sessionId, estimate);
      }
      round = sessionManager.getRound(sessionId);
      results = sessionManager.getResults(sessionId);
    }
    messagingUtils.sendResultsMessage(sessionId);
    return new VoteResponse(round, results);
  }
}
