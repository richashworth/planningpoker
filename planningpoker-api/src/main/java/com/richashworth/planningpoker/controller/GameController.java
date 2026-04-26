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
  private static final int MIN_USERNAME_LENGTH = 3;
  private static final String USERNAME_PATTERN = "^[a-zA-Z0-9 _-]+$";

  private final Logger logger = LoggerFactory.getLogger(getClass());
  private final SessionManager sessionManager;
  private final MessagingUtils messagingUtils;

  public GameController(SessionManager sessionManager, MessagingUtils messagingUtils) {
    this.sessionManager = sessionManager;
    this.messagingUtils = messagingUtils;
  }

  /**
   * Registers {@code userName} as a new member of {@code sessionId} and returns the session's
   * current scheme, host, round, results, and label. Broadcasts the updated user list to {@code
   * /topic/users/{sessionId}}.
   *
   * @throws IllegalArgumentException if the username is invalid, the session is not active, or the
   *     username (case-insensitive) is already taken in this session.
   */
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

  /**
   * Creates a new session with the requested estimation scheme and registers the requester as both
   * the first member and the host. Returns the generated session id, scheme metadata, and initial
   * (empty) results.
   *
   * @throws IllegalArgumentException if the username is invalid.
   */
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

  /**
   * Removes {@code userName} from {@code sessionId}. Broadcasts the updated user list and, if the
   * user had already voted this round, a {@code USER_LEFT_MESSAGE} so other clients can reconcile
   * their local result lists.
   *
   * @throws IllegalArgumentException if the session is not active or the user is not a member.
   */
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

  /**
   * Returns the current round, results, label, users, and host for {@code sessionId}, and
   * re-broadcasts the results and user list on the WebSocket topics. Used by clients as a fallback
   * when WebSocket messages appear to have been missed.
   */
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
    return new RefreshResponse(round, results, label, users, host, completedRounds);
  }

  /** Returns the list of usernames currently registered in {@code sessionId}. */
  @GetMapping("sessionUsers")
  public List<String> getSessionUsers(@RequestParam(name = "sessionId") final String sessionId) {
    return sessionManager.getSessionUsers(sessionId);
  }

  /**
   * Host-only action that removes {@code targetUser} from {@code sessionId}. Broadcasts the updated
   * user list and, if the target had voted this round, a {@code USER_LEFT_MESSAGE}.
   *
   * @throws HostActionException if {@code userName} is not the host.
   * @throws IllegalArgumentException if the host tries to kick themselves, the session is not
   *     active, or the target is not a member of the session.
   */
  @PostMapping("kick")
  public void kickUser(
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "targetUser") final String targetUser,
      @RequestParam(name = "sessionId") final String sessionId) {
    boolean targetHadVote;
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

  /**
   * Host-only action that transfers host status from {@code userName} to {@code targetUser}.
   * Broadcasts the updated user list so all clients see the new host.
   *
   * @throws HostActionException if {@code userName} is not the host.
   * @throws IllegalArgumentException if the host tries to promote themselves, the session is not
   *     active, or {@code userName}/{@code targetUser} is not a member.
   */
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
    messagingUtils.sendUsersMessage(sessionId);
  }

  /**
   * Host-only action that snapshots the current round's estimates into the session's
   * completed-rounds history (if any votes were cast), clears the current estimates, and increments
   * the round counter. Broadcasts {@code ROUND_COMPLETED_MESSAGE} (when a snapshot was taken)
   * followed by {@code RESET_MESSAGE} so every participant's client converges on the same history
   * and returns to the voting view.
   *
   * <p>The optional {@code consensus} parameter lets the host supply an override (e.g. from the
   * consensus card rail); if omitted, the server falls back to the mode of the captured estimates.
   *
   * @throws IllegalArgumentException if the session is not active or the user is not a member.
   * @throws HostActionException if the caller is not the host.
   */
  @PostMapping("reset")
  public ResetResponse reset(
      @RequestParam(name = "sessionId") final String sessionId,
      @RequestParam(name = "userName") final String userName,
      @RequestParam(name = "consensus", required = false) final String consensus) {
    int newRound;
    Round snapshot = null;
    synchronized (sessionManager) {
      validateSessionMembership(sessionId, userName);
      if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
        throw new HostActionException("only the host can perform this action");
      }
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

  /**
   * Host-only action that updates the session's label (the item/story currently being estimated).
   * Control characters are stripped and the value is capped at 100 characters. Broadcasts the
   * updated label to {@code /topic/results/{sessionId}} so all clients refresh.
   *
   * @throws IllegalArgumentException if the label exceeds 100 characters, the session is not
   *     active, or the user is not a member.
   * @throws HostActionException if the caller is not the host.
   */
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
}
