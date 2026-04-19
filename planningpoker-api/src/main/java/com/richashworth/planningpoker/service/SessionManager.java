package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Multimaps;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.SchemeConfig;
import com.richashworth.planningpoker.model.SchemeType;
import com.richashworth.planningpoker.util.LogSafeIds;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SessionManager {

  static final int MAX_SESSIONS = 100_000;
  static final int MAX_ID_ATTEMPTS = 100;

  private final Logger logger = LoggerFactory.getLogger(getClass());

  private final Set<String> activeSessions = Collections.synchronizedSet(new HashSet<>());
  private final ListMultimap<String, Estimate> sessionEstimates =
      Multimaps.synchronizedListMultimap(ArrayListMultimap.create());
  private final ListMultimap<String, String> sessionUsers =
      Multimaps.synchronizedListMultimap(ArrayListMultimap.create());
  private final ConcurrentHashMap<String, Instant> lastActivity = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, List<String>> sessionLegalValues =
      new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs =
      new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, String> sessionHosts = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, String> sessionLabels = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, AtomicInteger> sessionRounds = new ConcurrentHashMap<>();

  public boolean isSessionActive(final String sessionId) {
    return activeSessions.contains(sessionId);
  }

  public synchronized String createSession() {
    return createSession(new SchemeConfig("fibonacci", null, true));
  }

  public synchronized String createSession(SchemeConfig config) {
    if (activeSessions.size() >= MAX_SESSIONS) {
      throw new IllegalStateException("Too many active sessions");
    }
    String sessionId;
    int attempts = 0;
    do {
      if (attempts >= MAX_ID_ATTEMPTS) {
        throw new IllegalStateException(
            "Failed to generate unique session ID after " + MAX_ID_ATTEMPTS + " attempts");
      }
      sessionId = UUID.randomUUID().toString().substring(0, 8);
      attempts++;
    } while (activeSessions.contains(sessionId));
    activeSessions.add(sessionId);
    String csvValues =
        config.customValues() != null ? String.join(",", config.customValues()) : null;
    List<String> legal =
        SchemeType.resolveValues(config.schemeType(), csvValues, config.includeUnsure());
    sessionLegalValues.put(sessionId, legal);
    sessionSchemeConfigs.put(sessionId, config);
    sessionRounds.put(sessionId, new AtomicInteger(0));
    touchSession(sessionId);
    return sessionId;
  }

  public int getRound(String sessionId) {
    AtomicInteger round = sessionRounds.get(sessionId);
    return round == null ? 0 : round.get();
  }

  public int incrementAndGetRound(String sessionId) {
    return sessionRounds.computeIfAbsent(sessionId, k -> new AtomicInteger(0)).incrementAndGet();
  }

  public List<String> getSessionLegalValues(String sessionId) {
    List<String> values = sessionLegalValues.get(sessionId);
    return values != null ? List.copyOf(values) : List.of();
  }

  public SchemeConfig getSessionSchemeConfig(String sessionId) {
    return sessionSchemeConfigs.get(sessionId);
  }

  public String getHost(String sessionId) {
    return sessionHosts.get(sessionId);
  }

  public void setHost(String sessionId, String userName) {
    sessionHosts.put(sessionId, userName);
  }

  public void setLabel(String sessionId, String label) {
    String trimmed = label == null ? "" : label.substring(0, Math.min(label.length(), 100));
    sessionLabels.put(sessionId, trimmed);
    touchSession(sessionId);
  }

  public String getLabel(String sessionId) {
    return sessionLabels.getOrDefault(sessionId, "");
  }

  public void promoteHost(String sessionId, String targetUser) {
    if (!com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase(
        sessionUsers.get(sessionId), targetUser)) {
      throw new IllegalArgumentException("target user is not a member of this session");
    }
    sessionHosts.put(sessionId, targetUser);
    touchSession(sessionId);
  }

  public void registerEstimate(final String sessionId, final Estimate estimate) {
    sessionEstimates.put(sessionId, estimate);
    touchSession(sessionId);
  }

  public List<Estimate> getResults(final String sessionId) {
    return List.copyOf(sessionEstimates.get(sessionId));
  }

  public List<String> getSessionUsers(final String sessionId) {
    return List.copyOf(sessionUsers.get(sessionId));
  }

  public synchronized void clearSessions() {
    logger.info("Clearing all sessions (count={})", activeSessions.size());
    sessionUsers.clear();
    sessionEstimates.clear();
    activeSessions.clear();
    lastActivity.clear();
    sessionLegalValues.clear();
    sessionSchemeConfigs.clear();
    sessionHosts.clear();
    sessionLabels.clear();
    sessionRounds.clear();
  }

  public void resetSession(final String sessionId) {
    sessionEstimates.removeAll(sessionId);
    sessionLabels.remove(sessionId);
    touchSession(sessionId);
  }

  public void registerUser(final String userName, final String sessionId) {
    sessionUsers.put(sessionId, userName);
    sessionHosts.putIfAbsent(sessionId, userName);
    touchSession(sessionId);
  }

  public synchronized void removeUser(String userName, String sessionId) {
    sessionUsers.get(sessionId).removeIf(u -> u.equalsIgnoreCase(userName));
    sessionEstimates
        .entries()
        .removeIf(
            e ->
                e.getKey().equals(sessionId) && e.getValue().userName().equalsIgnoreCase(userName));
    String currentHost = sessionHosts.get(sessionId);
    if (currentHost != null && currentHost.equalsIgnoreCase(userName)) {
      List<String> remainingUsers = sessionUsers.get(sessionId);
      if (remainingUsers != null && !remainingUsers.isEmpty()) {
        sessionHosts.put(sessionId, remainingUsers.get(0));
      } else {
        sessionHosts.remove(sessionId);
      }
    }
    touchSession(sessionId);
  }

  public void touchSession(String sessionId) {
    lastActivity.put(sessionId, Instant.now());
  }

  public synchronized void evictIdleSessions() {
    Instant cutoff = Instant.now().minusSeconds(24 * 60 * 60);
    List<String> toEvict = new ArrayList<>();
    lastActivity.forEach(
        (sessionId, lastActive) -> {
          if (lastActive.isBefore(cutoff)) {
            toEvict.add(sessionId);
          }
        });
    for (String sessionId : toEvict) {
      logger.info("Evicting idle session {}", LogSafeIds.hash(sessionId));
      activeSessions.remove(sessionId);
      sessionEstimates.removeAll(sessionId);
      sessionUsers.removeAll(sessionId);
      lastActivity.remove(sessionId);
      sessionLegalValues.remove(sessionId);
      sessionSchemeConfigs.remove(sessionId);
      sessionHosts.remove(sessionId);
      sessionLabels.remove(sessionId);
      sessionRounds.remove(sessionId);
    }
    if (!toEvict.isEmpty()) {
      logger.info("Evicted {} idle session(s)", toEvict.size());
    }
  }
}
