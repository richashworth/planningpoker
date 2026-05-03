package com.richashworth.planningpoker.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.richashworth.planningpoker.model.CreateSessionRequest;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.Round;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SessionResponse;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Concurrency tests for the voting & reset slice, anchored to the verified VotingAndReset.tla spec.
 *
 * <p>The spec models every server-side action (CastVote, UpdateVote, ResetWithVotes, ResetEmpty) as
 * atomic — the round counter, vote map, and history are read/mutated as a single indivisible step
 * (summary §Concurrency). The backend enforces this by serialising the read-modify-write blocks
 * under {@code synchronized (sessionManager)} in {@link VoteController#vote} and {@link
 * GameController#reset}.
 *
 * <p>The spec confirms the "vote during reset" race is safe: every interleaving is equivalent to
 * <i>some</i> serial schedule (vote-then-reset captures the vote in the snapshot; reset-then-vote
 * attaches the vote to the new round). The user-visible <i>attribution</i> of which round a vote
 * belongs to is serialization-dependent, but no invariant is ever violated.
 *
 * <p>These tests hammer the controllers with concurrent vote/reset traffic and assert the spec's
 * structural invariants ({@code RoundMonotonic}, {@code AllVotesLegal}, {@code NoEmptySnapshots},
 * {@code HistoryRoundsBelowCurrent}, at-most-one-vote-per-member-per-round) hold under all observed
 * interleavings.
 */
class VotingAndResetConcurrencyTest {

  private SessionManager sessionManager;
  private MessagingUtils messagingUtils;
  private GameController gameController;
  private VoteController voteController;

  @BeforeEach
  void setUp() {
    sessionManager = new SessionManager();
    messagingUtils = mock(MessagingUtils.class);
    gameController = new GameController(sessionManager, messagingUtils);
    voteController = new VoteController(sessionManager, messagingUtils);
  }

  /**
   * Spec property: vote-during-reset race is safe. Many concurrent voters race against a single
   * reset thread; afterwards we assert:
   *
   * <ul>
   *   <li>at most one vote per member is recorded in the post-reset {@code serverVotes}
   *   <li>every recorded vote has a value in legalValues ({@code AllVotesLegal})
   *   <li>the snapshot, if any, contains only legal votes ({@code HistoryVotesLegal})
   *   <li>the round counter advanced by exactly 1 ({@code RoundMonotonic})
   * </ul>
   */
  @Test
  void testVoteDuringResetRaceMaintainsInvariants() throws InterruptedException {
    String sessionId = createSession("Host");
    int memberCount = 20;
    List<String> members = new ArrayList<>();
    for (int i = 0; i < memberCount; i++) {
      String name = String.format("Mem%02d", i);
      gameController.joinSession(sessionId, name);
      members.add(name);
    }

    int initialRound = sessionManager.getRound(sessionId);
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    String legal = legalValues.get(0);

    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(memberCount + 1);
    List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

    // 20 voter threads
    for (String member : members) {
      pool.submit(
          () -> {
            try {
              start.await();
              voteController.vote(sessionId, member, legal);
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }
    // 1 reset thread (host)
    pool.submit(
        () -> {
          try {
            start.await();
            gameController.reset(sessionId, "Host", null);
          } catch (Throwable t) {
            errors.add(t);
          }
        });

    start.countDown();
    pool.shutdown();
    assertTrue(pool.awaitTermination(15, TimeUnit.SECONDS));

    assertTrue(errors.isEmpty(), "no controller call should throw under concurrency: " + errors);

    int finalRound = sessionManager.getRound(sessionId);
    assertEquals(initialRound + 1, finalRound, "RoundMonotonic: exactly one reset advanced round");

    // At-most-one-vote-per-member in post-reset state
    List<Estimate> postVotes = sessionManager.getResults(sessionId);
    Set<String> seen = new HashSet<>();
    for (Estimate e : postVotes) {
      assertTrue(
          seen.add(e.userName()),
          "TypeOK: at most one vote per member per round; duplicate for " + e.userName());
      assertTrue(
          legalValues.contains(e.estimateValue()),
          "AllVotesLegal: " + e.estimateValue() + " must be in legalValues");
    }

    // History: the snapshot (if any) must contain only legal votes
    List<Round> history = sessionManager.getCompletedRounds(sessionId);
    for (Round snap : history) {
      assertNotNull(snap.votes());
      for (Estimate e : snap.votes()) {
        assertTrue(
            legalValues.contains(e.estimateValue()),
            "HistoryVotesLegal: snapshot vote " + e.estimateValue() + " must be in legalValues");
        assertTrue(
            members.contains(e.userName()),
            "snapshot vote attributed to a real member: " + e.userName());
      }
      assertTrue(
          snap.round() < finalRound,
          "HistoryRoundsBelowCurrent: snap.round (" + snap.round() + ") < " + finalRound);
    }

    // Total accounted-for votes (snapshot ∪ post-reset) <= memberCount, since each member
    // attempted exactly one vote and either landed pre-reset (snapshot) or post-reset.
    int snapshotVotes = history.isEmpty() ? 0 : history.get(0).votes().size();
    assertTrue(
        snapshotVotes + postVotes.size() <= memberCount,
        "no vote should appear in both snapshot and post-reset state");
  }

  /**
   * Spec property: many concurrent resets serialise; each bumps the round; empty rounds are skipped
   * from history (summary §Failure Modes — "Host triple-click reset"). Asserts {@code
   * RoundMonotonic} and {@code NoEmptySnapshots} hold across high-contention reset traffic.
   */
  @Test
  void testConcurrentResetsAllSerialiseAndAdvanceRound() throws InterruptedException {
    String sessionId = createSession("Host");
    int resetCount = 30;

    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(resetCount);
    AtomicInteger successes = new AtomicInteger(0);
    List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

    for (int i = 0; i < resetCount; i++) {
      pool.submit(
          () -> {
            try {
              start.await();
              gameController.reset(sessionId, "Host", null);
              successes.incrementAndGet();
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }

    start.countDown();
    pool.shutdown();
    assertTrue(pool.awaitTermination(15, TimeUnit.SECONDS));
    assertTrue(errors.isEmpty(), "no reset should fail: " + errors);
    assertEquals(resetCount, successes.get());

    // RoundMonotonic + every reset advanced the counter by exactly 1
    assertEquals(
        resetCount,
        sessionManager.getRound(sessionId),
        "RoundMonotonic: each of " + resetCount + " resets advanced serverRound by 1");

    // NoEmptySnapshots — there were never any votes in any round
    assertTrue(
        sessionManager.getCompletedRounds(sessionId).isEmpty(),
        "NoEmptySnapshots: empty rounds must not produce snapshots");
  }

  /**
   * Spec property: concurrent first-time CastVote actions by distinct members are safe — each
   * member's vote is recorded exactly once, no votes are lost, and {@code TypeOK} holds.
   */
  @Test
  void testConcurrentDistinctMemberVotesAllRecorded() throws InterruptedException {
    String sessionId = createSession("Host");
    int memberCount = 50;
    List<String> members = new ArrayList<>();
    for (int i = 0; i < memberCount; i++) {
      String name = "User" + i;
      gameController.joinSession(sessionId, name);
      members.add(name);
    }

    String legal = sessionManager.getSessionLegalValues(sessionId).get(0);
    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(memberCount);
    List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

    for (String member : members) {
      pool.submit(
          () -> {
            try {
              start.await();
              voteController.vote(sessionId, member, legal);
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }

    start.countDown();
    pool.shutdown();
    assertTrue(pool.awaitTermination(15, TimeUnit.SECONDS));
    assertTrue(errors.isEmpty(), "no vote should fail: " + errors);

    List<Estimate> votes = sessionManager.getResults(sessionId);
    assertEquals(
        memberCount,
        votes.size(),
        "every distinct-member CastVote should produce exactly one estimate");

    // At-most-one-vote-per-member
    Set<String> seen = new HashSet<>();
    for (Estimate e : votes) {
      assertTrue(
          seen.add(e.userName()),
          "TypeOK: at most one vote per member per round; duplicate for " + e.userName());
    }
  }

  /**
   * Spec property: {@code UpdateVote} and {@code Leave} are atomic — both mutate {@code
   * serverVotes} as a single indivisible step. The Java implementation must therefore serialise the
   * two SessionManager methods on the same monitor. {@code registerEstimate} synchronises on {@code
   * sessionEstimates}; {@code removeUser} must do the same when it iterates {@code entries()},
   * otherwise the multimap's iterator races with {@code put} and throws CME.
   *
   * <p>This test exercises {@link SessionManager} directly (not through controllers) because the
   * controller layer wraps both methods in {@code synchronized(sessionManager)}, which masks the
   * underlying API-level race. The SessionManager API must be safe on its own — scheduled tasks and
   * future callers will not always go through a controller.
   */
  @Test
  void testConcurrentRegisterEstimateAndRemoveUserMaintainsInvariants()
      throws InterruptedException {
    String sessionId = sessionManager.createSession(new SchemeConfig("fibonacci", null, true));
    int memberCount = 60;
    List<String> voters = new ArrayList<>();
    List<String> leavers = new ArrayList<>();
    String legal = sessionManager.getSessionLegalValues(sessionId).get(0);

    for (int i = 0; i < memberCount; i++) {
      String name = "M" + i;
      sessionManager.registerUser(name, sessionId);
      sessionManager.registerEstimate(sessionId, new Estimate(name, legal));
      if (i < memberCount / 2) {
        voters.add(name);
      } else {
        leavers.add(name);
      }
    }

    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(memberCount);
    List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
    int iterations = 100;

    for (String v : voters) {
      pool.submit(
          () -> {
            try {
              start.await();
              for (int n = 0; n < iterations; n++) {
                sessionManager.registerEstimate(sessionId, new Estimate(v, legal));
              }
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }
    for (String l : leavers) {
      pool.submit(
          () -> {
            try {
              start.await();
              for (int n = 0; n < iterations; n++) {
                sessionManager.removeUser(l, sessionId);
              }
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }

    start.countDown();
    pool.shutdown();
    assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
    assertTrue(
        errors.isEmpty(),
        "registerEstimate + removeUser must not race the multimap iteration: " + errors);

    // No leaver should have a lingering estimate
    Set<String> leaverSet = new HashSet<>(leavers);
    for (Estimate e : sessionManager.getResults(sessionId)) {
      assertFalse(
          leaverSet.contains(e.userName()),
          "leaver " + e.userName() + " has lingering estimate (race left stale state)");
    }
  }

  // ---------- helpers ----------

  private String createSession(String host) {
    SessionResponse response =
        gameController.createSession(new CreateSessionRequest(host, "fibonacci", null, true));
    return response.sessionId();
  }
}
