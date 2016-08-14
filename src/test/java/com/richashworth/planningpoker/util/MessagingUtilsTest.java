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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Created by Rich Ashworth on 14/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class MessagingUtilsTest {

    @InjectMocks
    private MessagingUtils messagingUtils;

    @Mock
    private SessionManager sessionManager;

    @Mock
    private SimpMessagingTemplate template;

    @Before
    public void setUp() {
        ReflectionTestUtils.setField(messagingUtils, "template", template);
    }

    @Test
    public void sendResultsMessage() throws Exception {
        when(sessionManager.getResults(SESSION_ID)).thenReturn(RESULTS);
        messagingUtils.sendResultsMessage(SESSION_ID);
        verify(template).convertAndSend("/topic/results/" + SESSION_ID, RESULTS);
    }

    @Test
    public void sendUsersMessage() throws Exception {
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(USERS);
        messagingUtils.sendUsersMessage(SESSION_ID);
        verify(template).convertAndSend("/topic/users/" + SESSION_ID, USERS);
    }

    @Test
    public void sendItemMessage() throws Exception {
        when(sessionManager.getCurrentItem(SESSION_ID)).thenReturn(ITEM);
        messagingUtils.sendItemMessage(SESSION_ID);
        verify(template).convertAndSend("/topic/item/" + SESSION_ID, ITEM);
    }

}