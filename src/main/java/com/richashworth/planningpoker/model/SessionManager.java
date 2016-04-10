package com.richashworth.planningpoker.model;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by rich on 09/04/2016.
 */
@Component
public class SessionManager {

    Multimap<Integer, Estimate> sessionsMap = ArrayListMultimap.create();
    AtomicInteger sessionSequence = new AtomicInteger(1);

    public boolean isSessionLive(Integer id) {
        return sessionsMap.containsKey(id);
    }

    public int createSession() {
        Integer i = sessionSequence.getAndIncrement();
        sessionsMap.put(i, null);
        return i;
    }

    public void registerEstimate(int sessionID, Estimate estimate) {
        sessionsMap.put(sessionID, estimate);
    }

    public List<Estimate> getResults(int sessionId) {
        List<Estimate> results = new ArrayList<>();
        for (Estimate estimate : sessionsMap.get(sessionId)) {
            if (null != estimate) {
                results.add(estimate);
            }
        }
        return results;
    }

    public void clearSessions() {
        sessionsMap.clear();
    }

    public void clearSession(Integer sessionId) {
        sessionsMap.removeAll(sessionId);
    }

    public List<String> getUsers(int sessionId) {
        List<String> users = new ArrayList<>();
        for (Estimate e : sessionsMap.get(sessionId)) {
            users.add(e.getUserId());
        }
        return users;
    }

}
