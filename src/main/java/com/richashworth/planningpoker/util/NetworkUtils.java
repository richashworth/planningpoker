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
public class NetworkUtils {

    public static final long LOW_NETWORK_LATENCY = 500L;
    public static final long HIGH_NETWORK_LATENCY = 1000L;
    public static final long MAX_NETWORK_LATENCY = 5000L;

    private final SessionManager sessionManager;

    @Autowired
    public NetworkUtils(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Autowired
    private SimpMessagingTemplate template;

    @Async
    public void burstUsersMessage(long sessionId) {
        for (final long latency : new long[]{LOW_NETWORK_LATENCY, HIGH_NETWORK_LATENCY, MAX_NETWORK_LATENCY}) {
            try {
                Thread.sleep(latency);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            template.convertAndSend("/topic/users/" + sessionId, sessionManager.getUsers(sessionId));
        }
    }
}
