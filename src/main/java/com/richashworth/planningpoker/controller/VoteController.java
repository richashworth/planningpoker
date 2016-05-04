package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.text.DecimalFormat;

/**
 * Created by Rich Ashworth on 09/04/2016.
 */
@RestController
public class VoteController {

    public static final DecimalFormat DECIMAL_FORMAT = new DecimalFormat("#.#");

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private SessionManager sessionManager;
    private MessagingUtils messagingUtils;

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    public VoteController(SessionManager sessionManager, MessagingUtils messagingUtils) {
        this.sessionManager = sessionManager;
        this.messagingUtils = messagingUtils;
    }

    @RequestMapping(value = "vote", method = RequestMethod.POST)
    public void vote(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "userName") final String userName,
            @RequestParam(name = "estimateValue") final Double estimateValue
    ) {
        logger.info(userName + " has voted " + DECIMAL_FORMAT.format(estimateValue) + " in session " + sessionId);
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("Session not active");
        }
        final Estimate estimate = new Estimate(userName, estimateValue);
        sessionManager.registerEstimate(sessionId, estimate);
        messagingUtils.burstResultsMessages(sessionId);
    }
}

