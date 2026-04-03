package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static com.richashworth.planningpoker.util.Clock.LATENCIES;
import static com.richashworth.planningpoker.util.MessagingUtils.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessagingUtilsTest {

    @InjectMocks
    private MessagingUtils messagingUtils;

    @Mock
    private Clock clock;

    @Mock
    private SessionManager sessionManager;

    @Mock
    private SimpMessagingTemplate template;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(messagingUtils, "clock", clock);
        ReflectionTestUtils.setField(messagingUtils, "template", template);
    }

    @Test
    void testGetTopic() {
        final String result = MessagingUtils.getTopic("/topic/root/", 1L);
        assertEquals("/topic/root/1", result);
    }

    @Test
    void testSendResultsMessage() {
        when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
        messagingUtils.sendResultsMessage(SESSION_ID);
        verifyMessageSent(1, getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(RESULTS));
    }

    @Test
    void testSendUsersMessage() {
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
        messagingUtils.sendUsersMessage(SESSION_ID);
        verifyMessageSent(1, getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage((USERS)));
    }

    @Test
    void testBurstResultsMessages() {
        when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
        messagingUtils.burstResultsMessages(SESSION_ID);
        for (long latency : LATENCIES) {
            verify(clock, times(1)).pause(latency);
        }
        verifyMessageSent(LATENCIES.length, getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(RESULTS));
    }

    @Test
    void testBurstUsersMessages() {
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
        messagingUtils.burstUsersMessages(SESSION_ID);
        for (long latency : LATENCIES) {
            verify(clock, times(1)).pause(latency);
        }
        verifyMessageSent(LATENCIES.length, getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage(USERS));
    }

    private void verifyMessageSent(int numberInvocations, String destination, Object payload) {
        verify(template, times(numberInvocations)).convertAndSend(destination, payload);
    }

}
