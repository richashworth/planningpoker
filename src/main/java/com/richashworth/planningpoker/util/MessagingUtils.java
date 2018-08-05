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
import static com.richashworth.planningpoker.util.MessagingUtils.MessageType.ITEM_MESSAGE;
import static com.richashworth.planningpoker.util.MessagingUtils.MessageType.RESULTS_MESSAGE;
import static com.richashworth.planningpoker.util.MessagingUtils.MessageType.USERS_MESSAGE;

/**
 * Created by Rich Ashworth on 03/05/2016.
 */
@Component
public class MessagingUtils {

    public static final String TOPIC_RESULTS = "/topic/results/";
    public static final String TOPIC_USERS = "/topic/users/";
    public static final String TOPIC_ITEM = "/topic/item/";

    private final SessionManager sessionManager;

    @Data
    @AllArgsConstructor
    private class Message {
        MessageType type;
        Object payload;
    }

    public enum MessageType {
        ITEM_MESSAGE,
        USERS_MESSAGE,
        RESULTS_MESSAGE
    }

    @Autowired
    private Clock clock;

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    public MessagingUtils(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    public void sendResultsMessage(long sessionId) {
        template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId), new Message(RESULTS_MESSAGE, sessionManager.getResults(sessionId)));
    }

    public void sendUsersMessage(long sessionId) {
        template.convertAndSend(getTopic(TOPIC_USERS, sessionId), new Message(USERS_MESSAGE, sessionManager.getSessionUsers(sessionId)));
    }

    public void sendItemMessage(long sessionId) {
        final String currentItem = sessionManager.getCurrentItem(sessionId);
        if (null != currentItem) {
            template.convertAndSend(getTopic(TOPIC_ITEM, sessionId), new Message(ITEM_MESSAGE, currentItem));
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

    @Contract(pure = true)
    public static String getTopic(String topicRoot, long sessionId) {
        return topicRoot + sessionId;
    }

}
