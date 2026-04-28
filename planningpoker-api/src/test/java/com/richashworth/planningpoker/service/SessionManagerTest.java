package com.richashworth.planningpoker.service;

import static org.junit.jupiter.api.Assertions.*;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.Round;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SchemeType;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SessionManagerTest {

  private SessionManager sessionManager;

  @BeforeEach
  void setUp() {
    sessionManager = new SessionManager();
  }

  @Test
  void testIsSessionActive() {
    String sessionId = sessionManager.createSession();
    assertTrue(sessionManager.isSessionActive(sessionId));
    assertFalse(sessionManager.isSessionActive("nonexistent"));
  }

  @Test
  void testSessionIdsAreUnique() {
    String session1 = sessionManager.createSession();
    String session2 = sessionManager.createSession();
    assertNotEquals(session1, session2);
  }

  @Test
  void testCreateSessionRejectsCollisions() {
    for (int i = 0; i < 100; i++) {
      sessionManager.createSession();
    }
  }

  @Test
  void testGetResults() {
    final String sessionId = sessionManager.createSession();
    final Estimate estimate = new Estimate("Rich A", "5");
    sessionManager.registerEstimate(sessionId, estimate);
    final List<Estimate> results = sessionManager.getResults(sessionId);
    assertEquals(Lists.newArrayList(estimate), results);
  }

  /**
   * Issue #111: registerEstimate is an upsert. A second call for the same user must replace the
   * prior value rather than append a duplicate.
   */
  @Test
  void testRegisterEstimateReplacesExistingForSameUser() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "8"));

    List<Estimate> results = sessionManager.getResults(sessionId);
    assertEquals(1, results.size(), "re-vote must not append a duplicate row");
    assertEquals(new Estimate("Alice", "8"), results.get(0), "re-vote must keep the new value");
  }

  /**
   * Issue #111: the upsert match is case-insensitive (matching {@link
   * SessionManager#removeUser(String, String)}'s behaviour).
   */
  @Test
  void testRegisterEstimateUpsertIsCaseInsensitive() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
    sessionManager.registerEstimate(sessionId, new Estimate("ALICE", "8"));

    List<Estimate> results = sessionManager.getResults(sessionId);
    assertEquals(1, results.size());
    assertEquals(new Estimate("ALICE", "8"), results.get(0));
  }

  /** Upsert for one user must not affect estimates from other users in the same session. */
  @Test
  void testRegisterEstimateDoesNotAffectOtherUsers() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
    sessionManager.registerEstimate(sessionId, new Estimate("Bob", "3"));
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "8"));

    List<Estimate> results = sessionManager.getResults(sessionId);
    assertEquals(2, results.size());
    assertTrue(results.contains(new Estimate("Alice", "8")));
    assertTrue(results.contains(new Estimate("Bob", "3")));
  }

  @Test
  void testGetResultsReturnsDefensiveCopy() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
    List<Estimate> results = sessionManager.getResults(sessionId);
    assertThrows(UnsupportedOperationException.class, () -> results.clear());
  }

  @Test
  void testGetSessionUsersReturnsDefensiveCopy() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    List<String> users = sessionManager.getSessionUsers(sessionId);
    assertThrows(UnsupportedOperationException.class, () -> users.clear());
  }

  @Test
  void testGetSessionUsers() {
    final String sessionId = sessionManager.createSession();
    final ArrayList<String> users = Lists.newArrayList("Alice", "Bob", "Marvin");
    registerUsers(sessionId, users);
    sessionManager.registerUser("Frank Z", sessionManager.createSession());
    assertEquals(users, sessionManager.getSessionUsers(sessionId));
  }

  @Test
  void testClearSessions() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Rich", sessionId);
    sessionManager.registerEstimate(sessionId, new Estimate("Rich", "8"));
    sessionManager.clearSessions();

    assertFalse(sessionManager.isSessionActive(sessionId));
  }

  @Test
  void testResetSession() {
    final String sessionId = sessionManager.createSession();
    final String userName = "Rich";
    sessionManager.registerUser(userName, sessionId);
    sessionManager.registerEstimate(sessionId, new Estimate(userName, "1"));
    sessionManager.resetSession(sessionId);
    assertTrue(sessionManager.getResults(sessionId).isEmpty());
    assertEquals(Lists.newArrayList(userName), sessionManager.getSessionUsers(sessionId));
  }

  @Test
  void testAppendAndGetCompletedRounds() {
    final String sessionId = sessionManager.createSession();
    assertTrue(sessionManager.getCompletedRounds(sessionId).isEmpty());

    Round r1 = new Round(1, "A", "5", List.of(new Estimate("Alice", "5")), "2026-04-21T10:00:00Z");
    Round r2 = new Round(2, "B", "3", List.of(new Estimate("Alice", "3")), "2026-04-21T10:05:00Z");
    sessionManager.appendCompletedRound(sessionId, r1);
    sessionManager.appendCompletedRound(sessionId, r2);

    List<Round> rounds = sessionManager.getCompletedRounds(sessionId);
    assertEquals(List.of(r1, r2), rounds);
    assertThrows(UnsupportedOperationException.class, () -> rounds.add(r1));
  }

  @Test
  void testCompletedRoundsClearedOnClearSessions() {
    final String sessionId = sessionManager.createSession();
    sessionManager.appendCompletedRound(
        sessionId, new Round(1, "A", "5", List.of(), "2026-04-21T10:00:00Z"));
    sessionManager.clearSessions();
    assertTrue(sessionManager.getCompletedRounds(sessionId).isEmpty());
  }

  @Test
  void testRemoveUserCleansUpEstimates() {
    final String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
    sessionManager.removeUser("Alice", sessionId);
    assertTrue(sessionManager.getResults(sessionId).isEmpty());
    assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
  }

  @Test
  void testEvictIdleSessions() throws Exception {
    String activeSession = sessionManager.createSession();
    sessionManager.registerUser("Alice", activeSession);

    String idleSession = sessionManager.createSession();
    sessionManager.registerUser("Bob", idleSession);
    sessionManager.registerEstimate(idleSession, new Estimate("Bob", "3"));

    // Use reflection to backdate the idle session's lastActivity to 25 hours ago
    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(idleSession, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();

    assertTrue(sessionManager.isSessionActive(activeSession));
    assertEquals(List.of("Alice"), sessionManager.getSessionUsers(activeSession));

    assertFalse(sessionManager.isSessionActive(idleSession));
    assertTrue(sessionManager.getSessionUsers(idleSession).isEmpty());
    assertTrue(sessionManager.getResults(idleSession).isEmpty());
  }

  @Test
  void testEvictIdleSessionsClearsAllSevenMaps() throws Exception {
    String sessionId = sessionManager.createSession(new SchemeConfig("fibonacci", null, true));
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));

    // Backdate lastActivity to 25 hours ago
    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(sessionId, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();

    assertFalse(sessionManager.isSessionActive(sessionId));
    assertTrue(sessionManager.getResults(sessionId).isEmpty());
    assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
    assertFalse(lastActivity.containsKey(sessionId));
    assertTrue(sessionManager.getSessionLegalValues(sessionId).isEmpty());
    assertNull(sessionManager.getSessionSchemeConfig(sessionId));
    assertNull(sessionManager.getHost(sessionId));
  }

  @Test
  void testEvictIdleSessionsDoesNotEvictActiveSession() throws Exception {
    String activeSession = sessionManager.createSession();
    sessionManager.registerUser("Alice", activeSession);
    sessionManager.registerEstimate(activeSession, new Estimate("Alice", "3"));

    sessionManager.evictIdleSessions();

    assertTrue(sessionManager.isSessionActive(activeSession));
    assertEquals(List.of("Alice"), sessionManager.getSessionUsers(activeSession));
    assertEquals(1, sessionManager.getResults(activeSession).size());
  }

  @Test
  void testEvictIdleSessionsDoesNotAffectConcurrentActiveSession() throws Exception {
    String activeSession = sessionManager.createSession();
    sessionManager.registerUser("Alice", activeSession);

    String idleSession = sessionManager.createSession();
    sessionManager.registerUser("Bob", idleSession);

    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(idleSession, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();

    assertFalse(sessionManager.isSessionActive(idleSession));
    assertTrue(sessionManager.getSessionUsers(idleSession).isEmpty());

    assertTrue(sessionManager.isSessionActive(activeSession));
    assertEquals(List.of("Alice"), sessionManager.getSessionUsers(activeSession));
    assertEquals("Alice", sessionManager.getHost(activeSession));
  }

  @Test
  void testMaxSessionsLimit() {
    assertEquals(100_000, SessionManager.MAX_SESSIONS);
  }

  @Test
  void testCreateSessionWithScheme() {
    SchemeConfig config = new SchemeConfig("fibonacci", null, true);
    String sessionId = sessionManager.createSession(config);
    assertNotNull(sessionId);
    assertEquals(8, sessionId.length());
    assertTrue(sessionManager.isSessionActive(sessionId));
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    assertTrue(legalValues.contains("1"));
    assertTrue(legalValues.contains("13"));
    assertTrue(legalValues.contains("?"));
    SchemeConfig retrieved = sessionManager.getSessionSchemeConfig(sessionId);
    assertNotNull(retrieved);
    assertEquals("fibonacci", retrieved.schemeType());
  }

  @Test
  void testCreateSessionDefaultScheme() {
    String sessionId = sessionManager.createSession();
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    List<String> expected = SchemeType.resolveValues("fibonacci", null, true);
    assertEquals(expected, legalValues);
  }

  @Test
  void testGetSessionLegalValuesReturnsDefensiveCopy() {
    String sessionId = sessionManager.createSession();
    List<String> legalValues = sessionManager.getSessionLegalValues(sessionId);
    assertThrows(UnsupportedOperationException.class, legalValues::clear);
  }

  @Test
  void testGetSessionSchemeConfigForUnknownSession() {
    assertNull(sessionManager.getSessionSchemeConfig("nonexistent"));
  }

  @Test
  void testGetSessionLegalValuesForUnknownSession() {
    List<String> values = sessionManager.getSessionLegalValues("nonexistent");
    assertNotNull(values);
    assertTrue(values.isEmpty());
  }

  @Test
  void testClearSessionsCleansSchemeData() {
    String sessionId = sessionManager.createSession(new SchemeConfig("fibonacci", null, true));
    sessionManager.clearSessions();
    assertNull(sessionManager.getSessionSchemeConfig(sessionId));
    assertTrue(sessionManager.getSessionLegalValues(sessionId).isEmpty());
  }

  @Test
  void testEvictIdleSessionsCleansSchemeData() throws Exception {
    String activeSession = sessionManager.createSession(new SchemeConfig("fibonacci", null, true));
    String idleSession = sessionManager.createSession(new SchemeConfig("tshirt", null, false));

    // Backdate lastActivity for idle session
    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(idleSession, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();

    // Active session scheme data preserved
    assertNotNull(sessionManager.getSessionSchemeConfig(activeSession));
    assertFalse(sessionManager.getSessionLegalValues(activeSession).isEmpty());

    // Idle session scheme data cleaned up
    assertNull(sessionManager.getSessionSchemeConfig(idleSession));
    assertTrue(sessionManager.getSessionLegalValues(idleSession).isEmpty());
  }

  @Test
  void testGetHostReturnsCreator() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    assertEquals("Alice", sessionManager.getHost(sessionId));
  }

  @Test
  void testGetHostReturnsNullForUnknownSession() {
    assertNull(sessionManager.getHost("nonexistent"));
  }

  @Test
  void testHostAutoPromotesOnRemoval() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.removeUser("Alice", sessionId);
    assertEquals("Bob", sessionManager.getHost(sessionId));
  }

  @Test
  void testHostDoesNotChangeWhenNonHostLeaves() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.removeUser("Bob", sessionId);
    assertEquals("Alice", sessionManager.getHost(sessionId));
  }

  @Test
  void testHostNullWhenLastUserLeaves() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.removeUser("Alice", sessionId);
    assertNull(sessionManager.getHost(sessionId));
  }

  @Test
  void testSetHostExplicitly() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.setHost(sessionId, "Bob");
    assertEquals("Bob", sessionManager.getHost(sessionId));
  }

  @Test
  void testClearSessionsCleansHostData() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.clearSessions();
    assertNull(sessionManager.getHost(sessionId));
  }

  @Test
  void testEvictIdleSessionsCleansHostData() throws Exception {
    String activeSession = sessionManager.createSession();
    sessionManager.registerUser("Alice", activeSession);

    String idleSession = sessionManager.createSession();
    sessionManager.registerUser("Bob", idleSession);

    // Backdate lastActivity for idle session
    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(idleSession, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();

    assertEquals("Alice", sessionManager.getHost(activeSession));
    assertNull(sessionManager.getHost(idleSession));
  }

  @Test
  void testHostPromotesToNextByJoinOrder() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.registerUser("Charlie", sessionId);
    sessionManager.removeUser("Alice", sessionId);
    assertEquals("Bob", sessionManager.getHost(sessionId));
  }

  @Test
  void testPromoteHost() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("userA", sessionId);
    sessionManager.registerUser("userB", sessionId);
    sessionManager.promoteHost(sessionId, "userB");
    assertEquals("userB", sessionManager.getHost(sessionId));
    assertTrue(sessionManager.getSessionUsers(sessionId).contains("userA"));
    assertTrue(sessionManager.getSessionUsers(sessionId).contains("userB"));
  }

  @Test
  void testPromoteHostToNonMemberThrows() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("userA", sessionId);
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class, () -> sessionManager.promoteHost(sessionId, "userB"));
    assertEquals("target user is not a member of this session", ex.getMessage());
  }

  @Test
  void testPromoteHostPreservesAllUsers() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("userA", sessionId);
    sessionManager.registerUser("userB", sessionId);
    sessionManager.registerUser("userC", sessionId);
    sessionManager.promoteHost(sessionId, "userC");
    List<String> users = sessionManager.getSessionUsers(sessionId);
    assertEquals(3, users.size());
    assertTrue(users.contains("userA"));
    assertTrue(users.contains("userB"));
    assertTrue(users.contains("userC"));
    assertEquals("userC", sessionManager.getHost(sessionId));
  }

  @Test
  void testRemoveUserCaseInsensitive() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.removeUser("bob", sessionId);
    assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
  }

  @Test
  void testRemoveUserExactCaseStillWorks() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Bob", sessionId);
    sessionManager.removeUser("Bob", sessionId);
    assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
  }

  @Test
  void testRemoveUserDoesNotRemoveNonMatchingUser() {
    String sessionId = sessionManager.createSession();
    sessionManager.registerUser("Alice", sessionId);
    sessionManager.removeUser("bob", sessionId);
    assertEquals(List.of("Alice"), sessionManager.getSessionUsers(sessionId));
  }

  @Test
  void testConcurrentCreateSession() throws InterruptedException {
    int threadCount = 50;
    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    CountDownLatch startLatch = new CountDownLatch(1);
    Set<String> sessionIds = Collections.newSetFromMap(new ConcurrentHashMap<>());

    for (int i = 0; i < threadCount; i++) {
      executor.submit(
          () -> {
            try {
              startLatch.await();
              String sessionId = sessionManager.createSession();
              sessionIds.add(sessionId);
            } catch (InterruptedException e) {
              Thread.currentThread().interrupt();
            }
          });
    }

    startLatch.countDown();
    executor.shutdown();
    assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
    assertEquals(
        threadCount,
        sessionIds.size(),
        "All 50 concurrent createSession calls must produce unique IDs");
  }

  @Test
  void testEvictionAtomicity() throws Exception {
    int sessionCount = 10;
    List<String> allSessions = new ArrayList<>();
    List<String> idleSessions = new ArrayList<>();

    for (int i = 0; i < sessionCount; i++) {
      String sessionId = sessionManager.createSession();
      sessionManager.registerUser("User" + i, sessionId);
      allSessions.add(sessionId);
    }

    // Backdate the first 5 sessions to be idle (25 hours ago)
    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);

    for (int i = 0; i < 5; i++) {
      String idleSessionId = allSessions.get(i);
      lastActivity.put(idleSessionId, Instant.now().minusSeconds(25 * 60 * 60));
      idleSessions.add(idleSessionId);
    }

    List<String> activeSessions = allSessions.subList(5, sessionCount);

    CountDownLatch evictionStart = new CountDownLatch(1);
    CountDownLatch evictionDone = new CountDownLatch(1);
    Thread evictionThread =
        new Thread(
            () -> {
              try {
                evictionStart.await();
                sessionManager.evictIdleSessions();
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              } finally {
                evictionDone.countDown();
              }
            });
    evictionThread.start();

    // Launch 20 reader threads that check consistency while eviction may be running
    int readerCount = 20;
    ExecutorService readers = Executors.newFixedThreadPool(readerCount);
    List<String> violations = Collections.synchronizedList(new ArrayList<>());

    for (int r = 0; r < readerCount; r++) {
      readers.submit(
          () -> {
            evictionStart.countDown(); // signal eviction to start (idempotent after first)
            for (int loop = 0; loop < 100; loop++) {
              for (String idleId : idleSessions) {
                boolean active = sessionManager.isSessionActive(idleId);
                if (active) {
                  // If still active, data maps must be consistent (session existed with a user)
                  List<String> users = sessionManager.getSessionUsers(idleId);
                  // If the session is reported active but has no users, that's a partial-eviction
                  // violation (the session was created with one user above, so users list
                  // should not be empty while active is still true)
                  // Note: users could legitimately become empty only after full eviction,
                  // at which point isSessionActive would return false.
                  if (users.isEmpty() && sessionManager.isSessionActive(idleId)) {
                    violations.add("Partial eviction detected for session " + idleId);
                  }
                }
              }
            }
          });
    }

    evictionStart.countDown();
    readers.shutdown();
    assertTrue(readers.awaitTermination(15, TimeUnit.SECONDS));
    evictionDone.await(10, TimeUnit.SECONDS);
    evictionThread.join(5000);

    assertTrue(violations.isEmpty(), "No partial eviction states should be visible: " + violations);

    // After eviction completes, idle sessions must be fully gone
    for (String idleId : idleSessions) {
      assertFalse(
          sessionManager.isSessionActive(idleId), "Idle session should be evicted: " + idleId);
      assertTrue(
          sessionManager.getSessionUsers(idleId).isEmpty(),
          "Users should be cleared for evicted session: " + idleId);
    }

    // Active sessions must still be intact
    for (int i = 0; i < activeSessions.size(); i++) {
      String activeId = activeSessions.get(i);
      assertTrue(
          sessionManager.isSessionActive(activeId),
          "Active session should still be active: " + activeId);
      assertFalse(
          sessionManager.getSessionUsers(activeId).isEmpty(),
          "Active session should still have users: " + activeId);
    }
  }

  private void registerUsers(String sessionId, ArrayList<String> users) {
    for (String user : users) {
      sessionManager.registerUser(user, sessionId);
    }
  }

  @Test
  void testGetRoundStartsAtZero() {
    String sessionId = sessionManager.createSession();
    assertEquals(0, sessionManager.getRound(sessionId));
  }

  @Test
  void testGetRoundForUnknownSessionReturnsZero() {
    assertEquals(0, sessionManager.getRound("nonexistent"));
  }

  @Test
  void testIncrementAndGetRound() {
    String sessionId = sessionManager.createSession();
    assertEquals(1, sessionManager.incrementAndGetRound(sessionId));
    assertEquals(2, sessionManager.incrementAndGetRound(sessionId));
    assertEquals(2, sessionManager.getRound(sessionId));
  }

  @Test
  void testClearSessionsWipesRounds() {
    String sessionId = sessionManager.createSession();
    sessionManager.incrementAndGetRound(sessionId);
    sessionManager.clearSessions();
    assertEquals(0, sessionManager.getRound(sessionId));
  }

  @Test
  void testEvictIdleSessionsWipesRounds() throws Exception {
    String idleSession = sessionManager.createSession();
    sessionManager.incrementAndGetRound(idleSession);
    sessionManager.incrementAndGetRound(idleSession);

    Field lastActivityField = SessionManager.class.getDeclaredField("lastActivity");
    lastActivityField.setAccessible(true);
    @SuppressWarnings("unchecked")
    ConcurrentHashMap<String, Instant> lastActivity =
        (ConcurrentHashMap<String, Instant>) lastActivityField.get(sessionManager);
    lastActivity.put(idleSession, Instant.now().minusSeconds(25 * 60 * 60));

    sessionManager.evictIdleSessions();
    assertEquals(0, sessionManager.getRound(idleSession));
  }
}
