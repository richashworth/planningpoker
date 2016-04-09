package com.richashworth.planningpoker.model;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by rich on 09/04/2016.
 */
@Component
public class SessionManager {
    Multimap<Integer, Estimate> sessionsMap = ArrayListMultimap.create();
    AtomicInteger sessionSequence = new AtomicInteger(1);

    public boolean isSessionLive(String id) {
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

    public Collection<Estimate> getResults(int sessionId) {
        return sessionsMap.get(sessionId);
    }

    public void clearSessions() {
        sessionsMap.clear();
    }
}
