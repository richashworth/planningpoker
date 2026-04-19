package com.richashworth.planningpoker.util;

import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.SESSION_ID;
import static com.richashworth.planningpoker.util.Clock.LATENCIES;
import static com.richashworth.planningpoker.util.MessagingUtils.TOPIC_RESULTS;
import static com.richashworth.planningpoker.util.MessagingUtils.getTopic;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.constraints.IntRange;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

/**
 * Property-based test for the reset-burst race — see specs/ResetBurstRace.tla and
 * specs/ResetBurstRaceFixed.tla for the model that drove this.
 *
 * <p>Host clicks "Next Item" → {@link MessagingUtils#sendResetNotification} bursts RESET_MESSAGE 6
 * times over ~7.7s. If a new vote arrives during that window, stale RESET messages from the earlier
 * reset clobber {@code voted=TRUE} on the client, flickering between Vote and Results views.
 *
 * <p>Property: for any iteration {@code voteIteration ∈ 0..LATENCIES.length}, once the server's
 * {@link SessionManager#getResults} has started reporting a non-empty list (a new vote has landed),
 * {@code sendResetNotification} must not emit any further RESET_MESSAGEs.
 */
class MessagingUtilsResetBurstPropertyTest {

  @Property(tries = 20)
  void sendResetNotification_doesNotEmitResetAfterVoteArrives(
      @ForAll @IntRange(min = 0, max = 5) int voteIteration) {
    SessionManager sessionManager = mock(SessionManager.class);
    SimpMessagingTemplate template = mock(SimpMessagingTemplate.class);
    Clock clock = mock(Clock.class);
    MessagingUtils messagingUtils = new MessagingUtils(sessionManager, clock, template);

    // Simulate a vote landing mid-burst: getResults() returns empty for the first
    // `voteIteration` calls, then non-empty thereafter. This models the real race
    // where a CastVote races the burst loop's pause() windows.
    AtomicInteger callCount = new AtomicInteger(0);
    when(sessionManager.getResults(SESSION_ID))
        .thenAnswer(
            invocation -> {
              int i = callCount.getAndIncrement();
              return i < voteIteration ? List.<Estimate>of() : List.of(new Estimate("Alice", "3"));
            });

    messagingUtils.sendResetNotification(SESSION_ID);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(template, atLeast(0))
        .convertAndSend(eq(getTopic(TOPIC_RESULTS, SESSION_ID)), captor.capture());
    int resetMessagesEmitted = captor.getAllValues().size();

    // With the fix, emits == voteIteration (stops once getResults() is non-empty).
    // Without the fix, emits == LATENCIES.length regardless, so the property fails
    // for every voteIteration < LATENCIES.length.
    assertThat(resetMessagesEmitted)
        .as(
            "RESET_MESSAGEs emitted after a vote landed at iteration %d (total emits=%d, LATENCIES=%d)",
            voteIteration, resetMessagesEmitted, LATENCIES.length)
        .isLessThanOrEqualTo(voteIteration);
  }
}
