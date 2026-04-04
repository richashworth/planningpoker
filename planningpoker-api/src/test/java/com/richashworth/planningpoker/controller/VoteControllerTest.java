package com.richashworth.planningpoker.controller;

import com.google.common.collect.Lists;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

import java.util.List;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class VoteControllerTest extends AbstractControllerTest {

    private static final List<String> FIBONACCI_VALUES = List.of(
            "0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e", "?", "\u2615"
    );

    @InjectMocks
    private VoteController voteController;

    @Test
    void testVote() {
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(FIBONACCI_VALUES);
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
        inOrder.verify(sessionManager, times(1)).getSessionLegalValues(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).isSessionActive(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getSessionUsers(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getResults(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).registerEstimate(SESSION_ID, ESTIMATE);
        inOrder.verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    void testVoteUserAlreadyVoted() {
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(FIBONACCI_VALUES);
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
        when(sessionManager.getResults(SESSION_ID)).thenReturn(Lists.newArrayList(ESTIMATE));
        voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
        inOrder.verify(sessionManager, times(1)).getSessionLegalValues(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).isSessionActive(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getSessionUsers(SESSION_ID);
        inOrder.verify(sessionManager, times(1)).getResults(SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstResultsMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }

    @Test
    void testVoteInvalidSession() {
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(FIBONACCI_VALUES);
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
        assertThrows(IllegalArgumentException.class, () ->
            voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE));
    }

    @Test
    void testVoteNonMemberRejected() {
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(FIBONACCI_VALUES);
        when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
        when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
        assertThrows(IllegalArgumentException.class, () ->
            voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE));
    }

    @Test
    void testVoteInvalidEstimateRejected() {
        when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(FIBONACCI_VALUES);
        assertThrows(IllegalArgumentException.class, () ->
            voteController.vote(SESSION_ID, USER_NAME, "999"));
    }
}
