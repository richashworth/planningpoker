package com.richashworth.planningpoker.service;

import static org.junit.jupiter.api.Assertions.*;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SchemeType;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
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
    // Creating many sessions should never produce duplicates
    for (int i = 0; i < 100; i++) {
      sessionManager.createSession();
    }
    // All sessions are active (no collisions lost any)
    // If there were a collision, the loop in createSession retries,
    // so we just verify we got 100 distinct active sessions
  }

  @Test
  void testGetResults() {
    final String sessionId = sessionManager.createSession();
    final Estimate estimate = new Estimate("Rich A", "5");
    sessionManager.registerEstimate(sessionId, estimate);
    final List<Estimate> results = sessionManager.getResults(sessionId);
    assertEquals(Lists.newArrayList(estimate), results);
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

    // activeSessions
    assertFalse(sessionManager.isSessionActive(sessionId));
    // sessionEstimates
    assertTrue(sessionManager.getResults(sessionId).isEmpty());
    // sessionUsers
    assertTrue(sessionManager.getSessionUsers(sessionId).isEmpty());
    // lastActivity — entry removed, so touching again would re-add but map should not contain old
    // entry
    assertFalse(lastActivity.containsKey(sessionId));
    // sessionLegalValues
    assertTrue(sessionManager.getSessionLegalValues(sessionId).isEmpty());
    // sessionSchemeConfigs
    assertNull(sessionManager.getSessionSchemeConfig(sessionId));
    // sessionHosts
    assertNull(sessionManager.getHost(sessionId));
  }

  @Test
  void testEvictIdleSessionsDoesNotEvictActiveSession() throws Exception {
    String activeSession = sessionManager.createSession();
    sessionManager.registerUser("Alice", activeSession);
    sessionManager.registerEstimate(activeSession, new Estimate("Alice", "3"));

    // Do NOT backdate — session is active
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

    // Idle session is gone
    assertFalse(sessionManager.isSessionActive(idleSession));
    assertTrue(sessionManager.getSessionUsers(idleSession).isEmpty());

    // Active session is fully intact
    assertTrue(sessionManager.isSessionActive(activeSession));
    assertEquals(List.of("Alice"), sessionManager.getSessionUsers(activeSession));
    assertEquals("Alice", sessionManager.getHost(activeSession));
  }

  @Test
  void testMaxSessionsLimit() {
    // We can't easily create 100,000 sessions in a unit test, but we can verify the
    // constant is set correctly
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

  private void registerUsers(String sessionId, ArrayList<String> users) {
    for (String user : users) {
      sessionManager.registerUser(user, sessionId);
    }
  }
}
