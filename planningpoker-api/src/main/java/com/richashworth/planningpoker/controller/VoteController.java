package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.CollectionUtils;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@CrossOrigin(origins = "*")
public class VoteController {

    private static final Set<String> LEGAL_ESTIMATES = Set.of(
            "0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e", "?", "\u2615"
    );

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;
    private final MessagingUtils messagingUtils;

    public VoteController(SessionManager sessionManager, MessagingUtils messagingUtils) {
        this.sessionManager = sessionManager;
        this.messagingUtils = messagingUtils;
    }

    @PostMapping("vote")
    public void vote(
            @RequestParam(name = "sessionId") final String sessionId,
            @RequestParam(name = "userName") final String userName,
            @RequestParam(name = "estimateValue") final String estimateValue
    ) {
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("Session not active");
        }
        if (!com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase(
                sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("User is not a member of this session");
        }
        if (!LEGAL_ESTIMATES.contains(estimateValue)) {
            throw new IllegalArgumentException("Invalid estimate value");
        }
        logger.info("{} has voted {} in session {}", userName, estimateValue, sessionId);
        if (!CollectionUtils.containsUserEstimate(sessionManager.getResults(sessionId), userName)) {
            final Estimate estimate = new Estimate(userName, estimateValue);
            sessionManager.registerEstimate(sessionId, estimate);
        }
        messagingUtils.burstResultsMessages(sessionId);
    }
}
