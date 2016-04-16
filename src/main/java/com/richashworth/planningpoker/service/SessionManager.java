package com.richashworth.planningpoker.service;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import com.richashworth.planningpoker.model.Estimate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Created by rich on 09/04/2016.
 */
@Component
public class SessionManager {

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final Multimap<Long, Estimate> sessionsMap = ArrayListMultimap.create();
    private final AtomicLong sessionSequence = new AtomicLong(1L);

    public boolean isSessionActive(long id) {
        return sessionsMap.containsKey(id);
    }

    public long createSession() {
        long i = sessionSequence.getAndIncrement();
        sessionsMap.put(i, null);
        return i;
    }

    public void registerEstimate(long sessionID, Estimate estimate) {
        sessionsMap.put(sessionID, estimate);
    }

    public List<Estimate> getResults(long sessionId) {
        List<Estimate> results = new ArrayList<>();
        for (Estimate estimate : sessionsMap.get(sessionId)) {
            if (null != estimate) {
                results.add(estimate);
            }
        }
        return results;
    }

    public void clearSessions() {
        logger.info("Clearing all sessions");
        sessionsMap.clear();
        sessionSequence.set(1L);
    }

    public void clearSession(long sessionId) {
        sessionsMap.removeAll(sessionId);
    }

    public List<String> getUsers(long sessionId) {
        List<String> users = new ArrayList<>();
        for (Estimate e : sessionsMap.get(sessionId)) {
            users.add(e.getUserName());
        }
        return users;
    }

}
