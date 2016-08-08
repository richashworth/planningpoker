package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ListMultimap;
import com.richashworth.planningpoker.model.Estimate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Created by Rich Ashworth on 09/04/2016.
 */
@Component
public class SessionManager {

    public static final Long SESSION_SEQ_START_VALUE = 1L;

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final AtomicLong sessionSequence = new AtomicLong(SESSION_SEQ_START_VALUE);
    private final ListMultimap<Long, Estimate> sessionEstimates = ArrayListMultimap.create();
    private final ListMultimap<Long, String> sessionUsers = ArrayListMultimap.create();
    private final Map<Long, String> sessionItems = new HashMap<Long, String>();

    public boolean isSessionActive(Long sessionId) {
        return SESSION_SEQ_START_VALUE <= sessionId && sessionId < sessionSequence.get();
    }

    public Long createSession() {
        return sessionSequence.getAndIncrement();
    }

    public void registerEstimate(Long sessionID, Estimate estimate) {
        sessionEstimates.put(sessionID, estimate);
    }

    public List<Estimate> getResults(Long sessionId) {
        return sessionEstimates.get(sessionId);
    }

    public List<String> getSessionUsers(Long sessionId) {
        return sessionUsers.get(sessionId);
    }

    public ListMultimap<Long, String> getGames() {
        return sessionUsers;
    }

    public synchronized void clearSessions() {
        logger.info("Clearing all sessions");
        sessionEstimates.clear();
        sessionUsers.clear();
        sessionItems.clear();
        sessionSequence.set(SESSION_SEQ_START_VALUE);
    }

    public void resetSession(Long sessionId) {
        sessionEstimates.removeAll(sessionId);
    }

    public void registerUser(String userName, Long sessionId) {
        sessionUsers.put(sessionId, userName);
    }

    public String getCurrentItem(Long sessionId) {
        return sessionItems.get(sessionId);
    }

    public void setCurrentItem(Long sessionId, String pItem) {
        sessionItems.put(sessionId, pItem);
    }
}
