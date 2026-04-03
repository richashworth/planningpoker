package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.google.common.collect.Multimaps;
import com.richashworth.planningpoker.model.Estimate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SessionManager {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final Set<String> activeSessions = Collections.synchronizedSet(new HashSet<>());
    private final ListMultimap<String, Estimate> sessionEstimates = Multimaps.synchronizedListMultimap(ArrayListMultimap.create());
    private final ListMultimap<String, String> sessionUsers = Multimaps.synchronizedListMultimap(ArrayListMultimap.create());

    public boolean isSessionActive(final String sessionId) {
        return activeSessions.contains(sessionId);
    }

    public String createSession() {
        String sessionId = UUID.randomUUID().toString().substring(0, 8);
        activeSessions.add(sessionId);
        return sessionId;
    }

    public void registerEstimate(final String sessionId, final Estimate estimate) {
        sessionEstimates.put(sessionId, estimate);
    }

    public List<Estimate> getResults(final String sessionId) {
        return sessionEstimates.get(sessionId);
    }

    public List<String> getSessionUsers(final String sessionId) {
        return sessionUsers.get(sessionId);
    }

    public ListMultimap<String, String> getSessions() {
        return sessionUsers;
    }

    public synchronized void clearSessions() {
        logger.info("Clearing all sessions");
        sessionUsers.clear();
        sessionEstimates.clear();
        activeSessions.clear();
    }

    public void resetSession(final String sessionId) {
        sessionEstimates.removeAll(sessionId);
    }

    public void registerUser(final String userName, final String sessionId) {
        sessionUsers.put(sessionId, userName);
    }

    public void removeUser(String userName, String sessionId) {
        sessionUsers.remove(sessionId, userName);
        sessionEstimates.get(sessionId).removeIf(e -> e.getUserName().equals(userName));
    }
}
