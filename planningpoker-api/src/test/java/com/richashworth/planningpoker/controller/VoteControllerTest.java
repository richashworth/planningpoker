package com.richashworth.planningpoker.controller;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.google.common.collect.Lists;
import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.VoteResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

class VoteControllerTest extends AbstractControllerTest {

  private static final List<String> STORY_POINT_VALUES =
      List.of(
          "0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e", "?", "\u2615");

  @InjectMocks private VoteController voteController;

  @Test
  void testVote() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(STORY_POINT_VALUES);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getRound(SESSION_ID)).thenReturn(2);
    List<Estimate> afterVote = List.of(ESTIMATE);
    when(sessionManager.getResults(SESSION_ID)).thenReturn(afterVote);
    VoteResponse response = voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE);
    assertEquals(2, response.round());
    assertEquals(afterVote, response.results());
    inOrder.verify(sessionManager, times(1)).isSessionActive(SESSION_ID);
    inOrder.verify(sessionManager, times(1)).getSessionLegalValues(SESSION_ID);
    inOrder.verify(sessionManager, times(1)).getSessionUsers(SESSION_ID);
    inOrder.verify(sessionManager, times(1)).registerEstimate(SESSION_ID, ESTIMATE);
    inOrder.verify(sessionManager, times(1)).getRound(SESSION_ID);
    inOrder.verify(sessionManager, times(1)).getResults(SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).sendResultsMessage(SESSION_ID);
    inOrder.verifyNoMoreInteractions();
  }

  @Test
  void testVoteInvalidSession() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(false);
    assertThrows(
        IllegalArgumentException.class,
        () -> voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE));
  }

  @Test
  void testVoteNonMemberRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(STORY_POINT_VALUES);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList());
    assertThrows(
        IllegalArgumentException.class,
        () -> voteController.vote(SESSION_ID, USER_NAME, ESTIMATE_VALUE));
  }

  @Test
  void testVoteInvalidEstimateRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionLegalValues(SESSION_ID)).thenReturn(STORY_POINT_VALUES);
    assertThrows(
        IllegalArgumentException.class, () -> voteController.vote(SESSION_ID, USER_NAME, "999"));
  }
}
