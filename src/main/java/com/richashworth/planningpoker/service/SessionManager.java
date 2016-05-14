package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Iterables;
import com.google.common.collect.ListMultimap;
import com.richashworth.planningpoker.model.Estimate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Created by Rich Ashworth on 09/04/2016.
 */
@Component
public class SessionManager {

    public static final Long SESSION_SEQ_START_VALUE = 1L;
    public static final String DEFAULT_ITEM_NAME = "the current item";

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final AtomicLong sessionSequence = new AtomicLong(SESSION_SEQ_START_VALUE);
    private final ListMultimap<Long, Estimate> sessionEstimates = ArrayListMultimap.create();
    private final ListMultimap<Long, String> sessionUsers = ArrayListMultimap.create();
    private final ListMultimap<Long, String> sessionItems = ArrayListMultimap.create();

    public boolean isSessionActive(Long sessionId) {
        return sessionId < sessionSequence.get();
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

    public List<String> getUsers(Long sessionId) {
        return sessionUsers.get(sessionId);
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
        logger.info("items = " + sessionItems.get(sessionId));
        String last = Iterables.getLast(sessionItems.get(sessionId), DEFAULT_ITEM_NAME);
        logger.info("item = " + last);
        return last;
    }

    public void setCurrentItem(Long sessionId, String pItem) {
        if (pItem.length() < 1) {
            sessionItems.put(sessionId, DEFAULT_ITEM_NAME);
        } else {
            sessionItems.put(sessionId, pItem);
        }
    }
}
