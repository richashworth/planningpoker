package com.richashworth.planningpoker.util;

import com.richashworth.planningpoker.service.SessionManager;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static com.richashworth.planningpoker.util.Clock.LATENCIES;
import static com.richashworth.planningpoker.util.MessagingUtils.*;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

/**
 * Created by Rich Ashworth on 14/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class MessagingUtilsTest {

    @InjectMocks
    private MessagingUtils messagingUtils;

    @Mock
    private Clock clock;

    @Mock
    private SessionManager sessionManager;

    @Mock
    private SimpMessagingTemplate template;

    @Before
    public void setUp() {
        ReflectionTestUtils.setField(messagingUtils, "clock", clock);
        ReflectionTestUtils.setField(messagingUtils, "template", template);
    }

    @Test
    public void testGetTopic() throws Exception {
        final String result = MessagingUtils.getTopic("/topic/root/", 1L);
        assertEquals("/topic/root/1", result);
    }

    @Test
    public void testSendResultsMessage() throws Exception {
        when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
        messagingUtils.sendResultsMessage(SESSION_ID);
        verifyMessageSent(1, getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(RESULTS));
    }


    @Test
    public void testSendUsersMessage() throws Exception {
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
        messagingUtils.sendUsersMessage(SESSION_ID);
        verifyMessageSent(1, getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage((USERS)));
    }

    @Test
    public void testSendItemMessage() throws Exception {
        when(sessionManager.getCurrentItem(SESSION_ID)).thenReturn(ITEM);
        messagingUtils.sendItemMessage(SESSION_ID);
        verifyMessageSent(1, getTopic(TOPIC_ITEM, SESSION_ID), messagingUtils.itemMessage(ITEM));
    }

    @Test
    public void testDoNotSendNullItemMessage() throws Exception {
        messagingUtils.sendItemMessage(SESSION_ID);
        verifyZeroInteractions(template);
    }

    @Test
    public void testBurstResultsMessages() throws Exception {
        when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
        messagingUtils.burstResultsMessages(SESSION_ID);
        for (long latency : LATENCIES) {
            verify(clock, times(1)).pause(latency);
        }
        verifyMessageSent(LATENCIES.length, getTopic(TOPIC_RESULTS, SESSION_ID), messagingUtils.resultsMessage(RESULTS));
    }

    @Test
    public void testBurstUsersMessages() throws Exception {
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
        messagingUtils.burstUsersMessages(SESSION_ID);
        for (long latency : LATENCIES) {
            verify(clock, times(1)).pause(latency);
        }
        verifyMessageSent(LATENCIES.length, getTopic(TOPIC_USERS, SESSION_ID), messagingUtils.usersMessage(USERS));
    }

    @Test
    public void testBurstItemMessages() throws Exception {
        when(sessionManager.getCurrentItem(SESSION_ID)).thenReturn(ITEM);
        messagingUtils.burstItemMessages(SESSION_ID);
        for (long latency : LATENCIES) {
            verify(clock, times(1)).pause(latency);
        }
        verifyMessageSent(LATENCIES.length, getTopic(TOPIC_ITEM, SESSION_ID), messagingUtils.itemMessage(ITEM));
    }

    private void verifyMessageSent(int numberInvocations, String destination, Object payload) {
        verify(template, times(numberInvocations)).convertAndSend(destination, payload);
    }

}