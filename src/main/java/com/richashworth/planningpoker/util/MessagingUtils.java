package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import static com.richashworth.planningpoker.util.Clock.LATENCIES;

/**
 * Created by Rich Ashworth on 03/05/2016.
 */
@Component
public class MessagingUtils {

    private final SessionManager sessionManager;

    @Autowired
    public MessagingUtils(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Autowired
    private Clock clock;

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
            clock.pause(LATENCY_DURATION);
            sendResultsMessage(sessionId);
        }
    }

    @Async
    public void burstUsersMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            clock.pause(LATENCY_DURATION);
            sendUsersMessage(sessionId);
        }
    }

    @Async
    public void burstItemMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            clock.pause(LATENCY_DURATION);
            sendItemMessage(sessionId);
        }
    }

}
