package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Multimaps;
import com.richashworth.planningpoker.model.Estimate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionManager {

    static final int MAX_SESSIONS = 10_000;
    static final int MAX_ID_ATTEMPTS = 100;

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final Set<String> activeSessions = Collections.synchronizedSet(new HashSet<>());
    private final ListMultimap<String, Estimate> sessionEstimates = Multimaps.synchronizedListMultimap(ArrayListMultimap.create());
    private final ListMultimap<String, String> sessionUsers = Multimaps.synchronizedListMultimap(ArrayListMultimap.create());
    private final ConcurrentHashMap<String, Instant> lastActivity = new ConcurrentHashMap<>();

    public boolean isSessionActive(final String sessionId) {
        return activeSessions.contains(sessionId);
    }

    public String createSession() {
        if (activeSessions.size() >= MAX_SESSIONS) {
            throw new IllegalStateException("Too many active sessions");
        }
        String sessionId;
        int attempts = 0;
        do {
            if (attempts >= MAX_ID_ATTEMPTS) {
                throw new IllegalStateException("Failed to generate unique session ID after " + MAX_ID_ATTEMPTS + " attempts");
            }
            sessionId = UUID.randomUUID().toString().substring(0, 8);
            attempts++;
        } while (activeSessions.contains(sessionId));
        activeSessions.add(sessionId);
        touchSession(sessionId);
        return sessionId;
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

    public ListMultimap<String, String> getSessions() {
        return sessionUsers;
    }

    public synchronized void clearSessions() {
        logger.info("Clearing all sessions");
        sessionUsers.clear();
        sessionEstimates.clear();
        activeSessions.clear();
        lastActivity.clear();
    }

    public void resetSession(final String sessionId) {
        sessionEstimates.removeAll(sessionId);
        touchSession(sessionId);
    }

    public void registerUser(final String userName, final String sessionId) {
        sessionUsers.put(sessionId, userName);
        touchSession(sessionId);
    }

    public void removeUser(String userName, String sessionId) {
        sessionUsers.remove(sessionId, userName);
        sessionEstimates.entries().removeIf(
                e -> e.getKey().equals(sessionId) && e.getValue().getUserName().equalsIgnoreCase(userName)
        );
        touchSession(sessionId);
    }

    public void touchSession(String sessionId) {
        lastActivity.put(sessionId, Instant.now());
    }

    public void evictIdleSessions() {
        Instant cutoff = Instant.now().minusSeconds(2 * 60 * 60);
        List<String> toEvict = new ArrayList<>();
        lastActivity.forEach((sessionId, lastActive) -> {
            if (lastActive.isBefore(cutoff)) {
                toEvict.add(sessionId);
            }
        });
        for (String sessionId : toEvict) {
            logger.info("Evicting idle session {}", sessionId);
            activeSessions.remove(sessionId);
            sessionEstimates.removeAll(sessionId);
            sessionUsers.removeAll(sessionId);
            lastActivity.remove(sessionId);
        }
        if (!toEvict.isEmpty()) {
            logger.info("Evicted {} idle session(s)", toEvict.size());
        }
    }
}
