package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;
import static com.richashworth.planningpoker.util.CollectionUtils.containsUserEstimate;

import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.RefreshResponse;
import com.richashworth.planningpoker.model.ResetResponse;
import com.richashworth.planningpoker.model.Round;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SessionResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.LogSafeIds;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
  private static final int MIN_USERNAME_LENGTH = 2;
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
    final SchemeConfig config;
    final List<String> values;
    final String host;
    final int round;
    final List<Estimate> results;
    final String label;
    final List<Round> completedRounds;
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
      config = sessionManager.getSessionSchemeConfig(sessionId);
      values = sessionManager.getSessionLegalValues(sessionId);
      host = sessionManager.getHost(sessionId);
      round = sessionManager.getRound(sessionId);
      results = sessionManager.getResults(sessionId);
      label = sessionManager.getLabel(sessionId);
      completedRounds = sessionManager.getCompletedRounds(sessionId);
    }
    messagingUtils.sendUsersMessage(sessionId);
    return new SessionResponse(
        host,
        null,
        config.schemeType(),
        values,
        config.includeUnsure(),
        round,
        results,
        label,
        completedRounds);
  }

  @PostMapping("createSession")
  public SessionResponse createSession(@RequestBody CreateSessionRequest request) {
    validateUserName(request.userName());
    final String sessionId;
    final SchemeConfig schemeConfig = buildSchemeConfig(request);
    synchronized (sessionManager) {
      sessionId = sessionManager.createSession(schemeConfig);
      sessionManager.registerUser(request.userName(), sessionId);
      logger.info(
          "user {} created session {}",
          LogSafeIds.hash(request.userName()),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendUsersMessage(sessionId);
    List<String> values = sessionManager.getSessionLegalValues(sessionId);
    String host = sessionManager.getHost(sessionId);
    int round = sessionManager.getRound(sessionId);
    return new SessionResponse(
        host,
        sessionId,
        schemeConfig.schemeType(),
        values,
        schemeConfig.includeUnsure(),
        round,
        List.of(),
        "",
        List.of());
  }

  @PostMapping("logout")
  public void leaveSession(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "sessionId") final String sessionId) {
    boolean hadVote;
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      hadVote = containsUserEstimate(sessionManager.getResults(sessionId), userName);
      sessionManager.removeUser(userName, sessionId);
      logger.info("user {} left session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendUsersMessage(sessionId);
    if (hadVote) {
      messagingUtils.sendUserLeftMessage(sessionId, userName);
    }
  }

  @GetMapping("refresh")
  public RefreshResponse refresh(@RequestParam(name = "sessionId") final String sessionId) {
    int round = sessionManager.getRound(sessionId);
    List<Estimate> results = sessionManager.getResults(sessionId);
    String label = sessionManager.getLabel(sessionId);
    List<String> users = sessionManager.getSessionUsers(sessionId);
    String host = sessionManager.getHost(sessionId);
    List<Round> completedRounds = sessionManager.getCompletedRounds(sessionId);
    messagingUtils.sendResultsMessage(sessionId);
    messagingUtils.sendUsersMessage(sessionId);
    messagingUtils.sendConsensusMessage(sessionId);
    return new RefreshResponse(round, results, label, users, host, completedRounds);
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
    boolean targetHadVote;
    synchronized (sessionManager) {
      requireHostActingOnOther(sessionId, userName, targetUser, "kick");
      targetHadVote = containsUserEstimate(sessionManager.getResults(sessionId), targetUser);
      sessionManager.removeUser(targetUser, sessionId);
      logger.info(
          "host {} kicked user {} from session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(targetUser),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendUsersMessage(sessionId);
    if (targetHadVote) {
      messagingUtils.sendUserLeftMessage(sessionId, targetUser);
    }
  }

  @PostMapping("promote")
  public void promoteUser(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "targetUser") final String targetUser,
      @RequestParam(name = "sessionId") final String sessionId) {
    synchronized (sessionManager) {
      requireHostActingOnOther(sessionId, userName, targetUser, "promote");
      sessionManager.promoteHost(sessionId, targetUser);
      logger.info(
          "host {} promoted user {} in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(targetUser),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendUsersMessage(sessionId);
  }

  @PostMapping("reset")
  public ResetResponse reset(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "consensus", required = false) final String consensus) {
    int newRound;
    Round snapshot = null;
    synchronized (sessionManager) {
      requireHost(sessionId, userName);
      logger.info(
          "host {} reset session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
      List<Estimate> votes = sessionManager.getResults(sessionId);
      if (!votes.isEmpty()) {
        String resolvedConsensus =
            (consensus != null && !consensus.isBlank()) ? consensus : modeOf(votes);
        snapshot =
            new Round(
                sessionManager.getRound(sessionId),
                sessionManager.getLabel(sessionId),
                resolvedConsensus,
                votes,
                Instant.now().toString());
        sessionManager.appendCompletedRound(sessionId, snapshot);
      }
      sessionManager.resetSession(sessionId);
      newRound = sessionManager.incrementAndGetRound(sessionId);
    }
    if (snapshot != null) {
      messagingUtils.sendRoundCompletedMessage(sessionId, snapshot);
    }
    // resetSession() cleared the override but didn't bump the consensus round; do that now via
    // setConsensusOverride so the broadcast carries a strictly newer round and isn't ignored.
    sessionManager.setConsensusOverride(sessionId, null);
    messagingUtils.sendConsensusMessage(sessionId);
    messagingUtils.sendResetMessage(sessionId, newRound);
    return new ResetResponse(newRound);
  }

  private static String modeOf(List<Estimate> votes) {
    return votes.stream()
        .collect(Collectors.groupingBy(Estimate::estimateValue, Collectors.counting()))
        .entrySet()
        .stream()
        .max(
            Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue)
                .thenComparing(Map.Entry::getKey, Comparator.reverseOrder()))
        .map(Map.Entry::getKey)
        .orElse("");
  }

  @PostMapping("setConsensus")
  public void setConsensus(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "value", required = false) final String value) {
    String normalised = (value == null || value.isBlank()) ? null : value;
    synchronized (sessionManager) {
      requireHost(sessionId, userName);
      sessionManager.setConsensusOverride(sessionId, normalised);
      logger.debug(
          "host {} set consensus override in session {}",
          LogSafeIds.hash(userName),
          LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendConsensusMessage(sessionId);
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
      requireHost(sessionId, userName);
      sessionManager.setLabel(sessionId, sanitized);
      logger.debug(
          "host {} set label in session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));
    }
    messagingUtils.sendResultsMessage(sessionId);
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

  // Membership is checked first so a non-member never sees a host-only error.
  private void requireHost(String sessionId, String userName) {
    validateSessionMembership(sessionId, userName);
    if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
      throw new HostActionException("only the host can perform this action");
    }
  }

  // Check order — membership, self-action guard, host check, target membership — is asserted by
  // tests.
  private void requireHostActingOnOther(
      String sessionId, String hostName, String targetUser, String verb) {
    validateSessionMembership(sessionId, hostName);
    if (hostName.equalsIgnoreCase(targetUser)) {
      throw new IllegalArgumentException("cannot " + verb + " yourself");
    }
    if (!hostName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
      throw new HostActionException("only the host can perform this action");
    }
    if (!containsIgnoreCase(sessionManager.getSessionUsers(sessionId), targetUser)) {
      throw new IllegalArgumentException("target user is not a member of this session");
    }
  }
}
