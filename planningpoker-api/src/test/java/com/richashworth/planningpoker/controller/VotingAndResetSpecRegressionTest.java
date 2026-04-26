package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.SessionResponse;
import com.richashworth.planningpoker.model.VoteResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

/**
 * Regression tests anchored to the verified VotingAndReset.tla spec.
 *
 * <p>These tests document known divergences between the current backend and the spec's intended
 * behaviour. Both are expected to FAIL against the current implementation and PASS once the
 * corresponding fixes land.
 *
 * <ul>
 *   <li><b>Issue #110</b> — Spec actions {@code ResetWithVotes} / {@code ResetEmpty} require {@code
 *       Host \in connected}; only the host may trigger reset. Current backend's {@link
 *       GameController#reset} accepts any session member.
 *   <li><b>Issue #111</b> — Spec action {@code UpdateVote(m, v)} replaces the member's existing
 *       vote with the new value. Current backend's {@link VoteController#vote} silently drops the
 *       second vote.
 * </ul>
 */
class VotingAndResetSpecRegressionTest extends AbstractControllerTest {

  @InjectMocks private GameController gameController;

  /**
   * Spec property: {@code ResetWithVotes} / {@code ResetEmpty} guard {@code Host \in connected}.
   * Issue #110 — non-host caller must be rejected with {@link HostActionException} (mapped to HTTP
   * 403 by {@link ErrorHandler}).
   *
   * <p>This test will FAIL until the host-only check is added to {@link GameController#reset}.
   */
  @Test
  void testResetByNonHostRejectedWith403() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID))
        .thenReturn(Lists.newArrayList("HostUser", "GuestUser"));
    // lenient() because the current (buggy) implementation never reads getHost during reset,
    // so a strict stub would trip UnnecessaryStubbingException. Once issue #110 is fixed and
    // reset() consults getHost(), the stub is exercised normally.
    lenient().when(sessionManager.getHost(SESSION_ID)).thenReturn("HostUser");
    // Same rationale: a host-checked reset short-circuits before reaching these. Today's reset
    // calls them, so we stub leniently to keep the test compatible with both code paths.
    lenient().when(sessionManager.getResults(SESSION_ID)).thenReturn(List.of());
    lenient().when(sessionManager.incrementAndGetRound(SESSION_ID)).thenReturn(1);

    assertThrows(
        HostActionException.class,
        () -> gameController.reset(SESSION_ID, "GuestUser", null),
        "non-host /reset must be rejected (issue #110: spec says reset is host-only)");
  }

  /**
   * Spec property: {@code UpdateVote(m, v)} replaces the member's prior vote when {@code
   * serverVotes[m] # v}. Issue #111 — backend currently no-ops the second vote, leaving the
   * original value in place.
   *
   * <p>End-to-end check using a real {@link SessionManager}: a single member votes "5", then
   * re-votes "8". The recorded vote in the post-call results list must be "8".
   *
   * <p>This test will FAIL until {@link VoteController#vote} replaces (rather than ignores) the
   * second vote.
   */
  @Test
  void testReVoteReplacesOriginalValue() {
    SessionManager realSessionManager = new SessionManager();
    MessagingUtils stubMessaging = mock(MessagingUtils.class);
    GameController gc = new GameController(realSessionManager, stubMessaging);
    VoteController vc = new VoteController(realSessionManager, stubMessaging);

    SessionResponse session =
        gc.createSession(new CreateSessionRequest("Alice", "fibonacci", null, true));
    String sessionId = session.sessionId();

    vc.vote(sessionId, "Alice", "5");
    VoteResponse second = vc.vote(sessionId, "Alice", "8");

    assertEquals(
        List.of(new Estimate("Alice", "8")),
        second.results(),
        "re-vote must replace the existing vote (issue #111: spec UpdateVote semantics)");
    // Sanity: also assert against the source of truth, not just the response payload.
    assertEquals(
        List.of(new Estimate("Alice", "8")),
        realSessionManager.getResults(sessionId),
        "SessionManager must reflect the replaced vote");
  }
}
