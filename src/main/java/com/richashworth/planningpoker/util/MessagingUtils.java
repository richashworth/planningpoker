package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Created by Rich Ashworth on 03/05/2016.
 */
@Component
public class MessagingUtils {

    public static final long[] LATENCIES = new long[]{0L, 50L, 100L, 500L, 1000L, 2000L, 5000L, 10000L};

    private final SessionManager sessionManager;

    @Autowired
    public MessagingUtils(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Autowired
    private SimpMessagingTemplate template;

    public void sendResultsMessage(long sessionId) {
        template.convertAndSend("/topic/results/" + sessionId, sessionManager.getResults(sessionId));
    }

    public void sendUsersMessage(long sessionId) {
        template.convertAndSend("/topic/users/" + sessionId, sessionManager.getSessionUsers(sessionId));
    }

    public void sendItemMessage(long sessionId) {
        final String currentItem = sessionManager.getCurrentItem(sessionId);
        if (null != currentItem) {
            template.convertAndSend("/topic/item/" + sessionId, currentItem);
        }
    }

    @Async
    public void burstResultsMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            pause(LATENCY_DURATION);
            sendResultsMessage(sessionId);
        }
    }

    @Async
    public void burstUsersMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            pause(LATENCY_DURATION);
            sendUsersMessage(sessionId);
        }
    }

    @Async
    public void burstItemMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            pause(LATENCY_DURATION);
            sendItemMessage(sessionId);
        }
    }

    private void pause(long latency) {
        try {
            Thread.sleep(latency);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}
