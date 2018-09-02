package com.richashworth.planningpoker.controller;

import com.google.common.collect.Lists;
import org.junit.Test;
import org.mockito.InjectMocks;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

/**
 * Created by Rich Ashworth on 09/08/2016.
 */
public class VoteControllerTest extends AbstractControllerTest {

    @InjectMocks
    private VoteController voteController;

    @Test
    public void testVote() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
        inOrder.verify(sessionManager, times(1)).isSessionActive(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getResults(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).registerEstimate(SESSION_ID, ESTIMATE);
        inOrder.verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    public void testVoteUserAlreadyVoted() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getResults(SESSION_ID)).thenReturn(Lists.newArrayList(ESTIMATE));
        voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
        inOrder.verify(sessionManager, times(1)).isSessionActive(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getResults(SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testVoteInvalidSession() throws Exception {
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
        voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
    }

}