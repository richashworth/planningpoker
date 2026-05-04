package com.richashworth.planningpoker.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.ResetResponse;
import com.richashworth.planningpoker.model.Round;
import com.richashworth.planningpoker.model.SessionResponse;
import com.richashworth.planningpoker.model.VoteResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * End-to-end state-transition tests for the voting & reset slice, anchored to the verified {@code
 * VotingAndReset.tla} spec.
 *
 * <p>These tests wire real {@link SessionManager} and {@link GameController}/{@link VoteController}
 * instances together with a stubbed {@link MessagingUtils}, then walk through sequences of spec
 * actions ({@code CastVote}, {@code ResetWithVotes}, {@code ResetEmpty}) and assert that state
 * matches the spec's primed variables and structural invariants ({@code TypeOK}, {@code
 * AllVotesLegal}, {@code RoundMonotonic}, {@code VotesClearedAfterReset}, {@code NoEmptySnapshots},
 * {@code HistoryRoundsBelowCurrent}).
 *
 * <p>Note: tests in this file assert <i>spec</i> behaviour. Where the current backend diverges from
 * the spec (issues #110, #111) we use only operations that match current behaviour, so these tests
 * pass against today's code.
 */
class VotingAndResetStateTransitionTest {

  private SessionManager sessionManager;
  private MessagingUtils messagingUtils;
  private GameController gameController;
  private VoteController voteController;

  // Mirror of the spec's MaxRounds = 2 / LegalValues = {1, 2} domain — but we use the real
  // fibonacci scheme since SessionManager has no constructor for arbitrary legal values.
  private static final String LEGAL_1 = "1";
  private static final String LEGAL_2 = "2";

  @BeforeEach
  void setUp() {
    sessionManager = new SessionManager();
    messagingUtils = mock(MessagingUtils.class);
    gameController = new GameController(sessionManager, messagingUtils);
    voteController = new VoteController(sessionManager, messagingUtils);
  }

  // ---------- spec Init ----------

  /** Spec property: {@code Init} — fresh session has round=0, no votes, no history. */
  @Test
  void testInitStateMatchesSpec() {
    String sessionId = createSessionAndJoin("Host");

    assertEquals(0, sessionManager.getRound(sessionId), "Init: serverRound = 0");
    assertTrue(sessionManager.getResults(sessionId).isEmpty(), "Init: serverVotes all NoVote");
    assertTrue(sessionManager.getCompletedRounds(sessionId).isEmpty(), "Init: history = << >>");
    assertEquals("Host", sessionManager.getHost(sessionId), "Init: designated host assigned");
  }

  // ---------- CastVote → ResetWithVotes ----------

  /**
   * Spec sequence: {@code CastVote(m1, v) → ResetWithVotes}. Exercises the full cast →
   * vote-recorded → reset → cleared transition for a single member, asserting:
   *
   * <ul>
   *   <li>after CastVote: serverVotes[m1] = v, serverRound unchanged
   *   <li>after ResetWithVotes: serverVotes = EmptyVotes, serverRound incremented, history appended
   *       with the prior snapshot
   * </ul>
   */
  @Test
  void testCastThenResetSingleMember() {
    String sessionId = createSessionAndJoin("Alice");

    // CastVote(Alice, "1")
    VoteResponse voteResponse = voteController.vote(sessionId, "Alice", LEGAL_1);
    assertEquals(0, voteResponse.round(), "round unchanged by CastVote");
    assertEquals(
        List.of(new Estimate("Alice", LEGAL_1)),
        sessionManager.getResults(sessionId),
        "serverVotes[Alice] = 1");

    // ResetWithVotes (Alice is the host so this works under the spec's host-only rule)
    ResetResponse resetResponse = gameController.reset(sessionId, "Alice", null);

    assertEquals(1, resetResponse.round(), "RoundMonotonic: serverRound' = serverRound + 1");
    assertTrue(
        sessionManager.getResults(sessionId).isEmpty(),
        "VotesClearedAfterReset: serverVotes' = EmptyVotes");
    List<Round> history = sessionManager.getCompletedRounds(sessionId);
    assertEquals(1, history.size(), "history' = Append(history, snap)");
    assertEquals(0, history.get(0).round(), "snap.round = pre-reset serverRound");
    assertEquals(
        List.of(new Estimate("Alice", LEGAL_1)),
        history.get(0).votes(),
        "snap.votes captured the cast vote");
  }

  /**
   * Spec sequence: multiple members CastVote, then ResetWithVotes. Verifies snapshot captures every
   * member's vote and post-reset state is fully cleared.
   */
  @Test
  void testCastByMultipleMembersThenReset() {
    String sessionId = createSessionAndJoin("Host");
    gameController.joinSession(sessionId, "Alice", false);
    gameController.joinSession(sessionId, "Bob", false);

    voteController.vote(sessionId, "Alice", LEGAL_1);
    voteController.vote(sessionId, "Bob", LEGAL_2);
    voteController.vote(sessionId, "Host", LEGAL_2);

    List<Estimate> beforeReset = sessionManager.getResults(sessionId);
    assertEquals(3, beforeReset.size(), "all three first-time votes recorded");

    ResetResponse response = gameController.reset(sessionId, "Host", null);

    assertEquals(1, response.round());
    assertTrue(sessionManager.getResults(sessionId).isEmpty(), "VotesClearedAfterReset");

    List<Round> history = sessionManager.getCompletedRounds(sessionId);
    assertEquals(1, history.size());
    assertEquals(beforeReset, history.get(0).votes(), "snap.votes = pre-reset serverVotes");
  }

  // ---------- ResetEmpty ----------

  /**
   * Spec property: {@code ResetEmpty} guard {@code ~ HasAnyVote(serverVotes)} → no snapshot
   * appended, but serverRound still advances. This is the spec invariant {@code NoEmptySnapshots}.
   */
  @Test
  void testResetEmptyDoesNotProduceSnapshot() {
    String sessionId = createSessionAndJoin("Host");

    ResetResponse response = gameController.reset(sessionId, "Host", null);

    assertEquals(1, response.round(), "serverRound advances even with no votes");
    assertTrue(
        sessionManager.getCompletedRounds(sessionId).isEmpty(),
        "NoEmptySnapshots: history unchanged when round was empty");
  }

  // ---------- Multi-round / monotonicity ----------

  /**
   * Spec invariants {@code RoundMonotonic} and {@code HistoryRoundsBelowCurrent}: across many
   * cast→reset cycles, the round counter only increases and every snapshot's round is strictly less
   * than the current serverRound.
   */
  @Test
  void testRoundMonotonicAcrossManyResets() {
    String sessionId = createSessionAndJoin("Host");

    int previousRound = sessionManager.getRound(sessionId);
    for (int i = 0; i < 10; i++) {
      voteController.vote(sessionId, "Host", LEGAL_1);
      ResetResponse r = gameController.reset(sessionId, "Host", null);
      assertTrue(r.round() > previousRound, "RoundMonotonic: serverRound' > serverRound");
      previousRound = r.round();
    }

    // HistoryRoundsBelowCurrent
    int currentRound = sessionManager.getRound(sessionId);
    List<Round> history = sessionManager.getCompletedRounds(sessionId);
    assertEquals(10, history.size(), "10 non-empty resets produced 10 snapshots");
    for (Round snap : history) {
      assertTrue(
          snap.round() < currentRound,
          "HistoryRoundsBelowCurrent: snap.round (" + snap.round() + ") < serverRound");
    }
  }

  /**
   * Spec invariant {@code NoEmptySnapshots}: when reset cycles alternate between empty and
   * non-empty rounds, only the non-empty rounds appear in history, and each one carries at least
   * one cast vote.
   */
  @Test
  void testHistoryNeverContainsEmptySnapshots() {
    String sessionId = createSessionAndJoin("Host");

    // 5 alternating cycles: vote+reset (snapshot), then reset-empty (no snapshot)
    for (int i = 0; i < 5; i++) {
      voteController.vote(sessionId, "Host", LEGAL_1);
      gameController.reset(sessionId, "Host", null); // ResetWithVotes
      gameController.reset(sessionId, "Host", null); // ResetEmpty
    }

    List<Round> history = sessionManager.getCompletedRounds(sessionId);
    assertEquals(5, history.size(), "only the 5 non-empty resets produced snapshots");
    for (Round snap : history) {
      assertFalse(snap.votes().isEmpty(), "NoEmptySnapshots: every snap.votes has a cast vote");
    }
  }

  // ---------- TypeOK-style invariants ----------

  /**
   * Spec invariant {@code AllVotesLegal} ∧ {@code HistoryVotesLegal}: every vote currently held and
   * every vote in history has a value drawn from the session's legal values. Walks a mixed sequence
   * of cast/reset operations and re-checks after each step.
   */
  @Test
  void testAllVotesAndHistoryVotesAreLegal() {
    String sessionId = createSessionAndJoin("Host");
    gameController.joinSession(sessionId, "Alice", false);

    Set<String> legal = new HashSet<>(sessionManager.getSessionLegalValues(sessionId));

    // Sequence: cast, cast, reset, cast, reset-empty, cast, reset
    voteController.vote(sessionId, "Host", LEGAL_1);
    assertAllVotesLegal(sessionId, legal);
    voteController.vote(sessionId, "Alice", LEGAL_2);
    assertAllVotesLegal(sessionId, legal);
    gameController.reset(sessionId, "Host", null);
    assertAllVotesLegal(sessionId, legal);
    assertHistoryVotesLegal(sessionId, legal);
    voteController.vote(sessionId, "Host", LEGAL_2);
    assertAllVotesLegal(sessionId, legal);
    gameController.reset(sessionId, "Host", null);
    assertAllVotesLegal(sessionId, legal);
    assertHistoryVotesLegal(sessionId, legal);
    gameController.reset(sessionId, "Host", null); // empty
    assertAllVotesLegal(sessionId, legal);
    assertHistoryVotesLegal(sessionId, legal);
  }

  /**
   * Spec structural property: {@code serverVotes \in [Members -> LegalValues \cup {NoVote}]}
   * implies at most one vote per member per round. Since the backend stores votes in a list, we
   * explicitly assert the per-member uniqueness invariant after each cast operation.
   */
  @Test
  void testAtMostOneVotePerMemberPerRound() {
    String sessionId = createSessionAndJoin("Host");
    gameController.joinSession(sessionId, "Alice", false);
    gameController.joinSession(sessionId, "Bob", false);

    voteController.vote(sessionId, "Alice", LEGAL_1);
    voteController.vote(sessionId, "Bob", LEGAL_2);
    voteController.vote(sessionId, "Host", LEGAL_1);
    // Re-vote replaces the prior estimate (issue #111: spec UpdateVote) — count must stay 1
    voteController.vote(sessionId, "Alice", LEGAL_2);
    voteController.vote(sessionId, "Bob", LEGAL_1);

    List<Estimate> votes = sessionManager.getResults(sessionId);
    Set<String> seen = new HashSet<>();
    for (Estimate e : votes) {
      assertTrue(
          seen.add(e.userName()),
          "TypeOK: at most one vote per member per round; duplicate for " + e.userName());
    }
  }

  /**
   * Spec property: {@code KnownRoundBoundedByServer} (server-side analogue) — every snapshot's
   * round number is in 0..MaxRounds and strictly less than the current serverRound. Combined with
   * the {@code TypeOK} bound, no snapshot can carry a "future" round.
   */
  @Test
  void testHistoryRoundsAreAllStrictlyLessThanCurrent() {
    String sessionId = createSessionAndJoin("Host");

    for (int i = 0; i < 4; i++) {
      voteController.vote(sessionId, "Host", LEGAL_1);
      gameController.reset(sessionId, "Host", null);
    }

    int currentRound = sessionManager.getRound(sessionId);
    for (Round snap : sessionManager.getCompletedRounds(sessionId)) {
      assertTrue(
          snap.round() >= 0 && snap.round() < currentRound,
          "HistoryRoundsBelowCurrent: 0 <= snap.round (" + snap.round() + ") < " + currentRound);
    }
  }

  // ---------- helpers ----------

  private String createSessionAndJoin(String host) {
    SessionResponse response =
        gameController.createSession(new CreateSessionRequest(host, "fibonacci", null, true, null));
    return response.sessionId();
  }

  private void assertAllVotesLegal(String sessionId, Set<String> legalValues) {
    for (Estimate e : sessionManager.getResults(sessionId)) {
      assertTrue(
          legalValues.contains(e.estimateValue()),
          "AllVotesLegal: " + e.estimateValue() + " must be in legalValues");
    }
  }

  private void assertHistoryVotesLegal(String sessionId, Set<String> legalValues) {
    for (Round snap : sessionManager.getCompletedRounds(sessionId)) {
      for (Estimate e : snap.votes()) {
        assertTrue(
            legalValues.contains(e.estimateValue()),
            "HistoryVotesLegal: snapshot vote " + e.estimateValue() + " must be in legalValues");
      }
    }
  }
}
