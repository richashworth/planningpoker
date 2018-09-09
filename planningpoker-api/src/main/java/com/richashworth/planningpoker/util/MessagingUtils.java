package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.jetbrains.annotations.Contract;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import static com.richashworth.planningpoker.util.Clock.LATENCIES;

@Component
public class MessagingUtils {

    public static final String TOPIC_RESULTS = "/topic/results/";
    public static final String TOPIC_USERS = "/topic/users/";
    public static final String TOPIC_ITEM = "/topic/item/";

    private final SessionManager sessionManager;
    private final Clock clock;
    private final SimpMessagingTemplate template;

    @Autowired
    public MessagingUtils(SessionManager sessionManager, Clock clock, SimpMessagingTemplate template) {
        this.sessionManager = sessionManager;
        this.clock = clock;
        this.template = template;
    }

    @Contract(pure = true)
    public static String getTopic(String topicRoot, long sessionId) {
        return topicRoot + sessionId;
    }

    public void sendResultsMessage(long sessionId) {
        template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId), resultsMessage(sessionManager.getResults(sessionId)));
    }

    public void sendUsersMessage(long sessionId) {
        template.convertAndSend(getTopic(TOPIC_USERS, sessionId), usersMessage(sessionManager.getSessionUsers(sessionId)));
    }

    public void sendItemMessage(long sessionId) {
        final String currentItem = sessionManager.getCurrentItem(sessionId);
        if (null != currentItem) {
            template.convertAndSend(getTopic(TOPIC_ITEM, sessionId), itemMessage(currentItem));
        }
    }

    @Async
    public void burstResultsMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            sendResultsMessage(sessionId);
            clock.pause(LATENCY_DURATION);
        }
    }

    @Async
    public void burstUsersMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            sendUsersMessage(sessionId);
            clock.pause(LATENCY_DURATION);
        }
    }

    @Async
    public void burstItemMessages(long sessionId) {
        for (final long LATENCY_DURATION : LATENCIES) {
            sendItemMessage(sessionId);
            clock.pause(LATENCY_DURATION);
        }
    }

    Message itemMessage(Object payload) {
        return new Message(MessageType.ITEM_MESSAGE, payload);
    }

    Message resultsMessage(Object payload) {
        return new Message(MessageType.RESULTS_MESSAGE, payload);
    }

    Message usersMessage(Object payload) {
        return new Message(MessageType.USERS_MESSAGE, payload);
    }

    private enum MessageType {
        ITEM_MESSAGE,
        USERS_MESSAGE,
        RESULTS_MESSAGE
    }

    @Data
    @AllArgsConstructor
    private class Message {
        MessageType type;
        Object payload;
    }

}
