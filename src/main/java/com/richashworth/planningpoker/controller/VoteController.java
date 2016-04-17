package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by rich on 09/04/2016.
 */
@RestController
public class VoteController {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;

    @Autowired
    public VoteController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @RequestMapping(value = "vote", method = RequestMethod.POST)
    public void vote(
            @RequestParam(name = "sessionId") Long sessionId,
            @RequestParam(name = "userName") String userName,
            @RequestParam(name = "estimateValue") Double estimateValue
    ) {
        String estimateStr = String.valueOf(estimateValue).replaceAll(".0", "");
        logger.info(userName + " has voted " + estimateStr + " in session " + sessionId);
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("Session not active");
        }
        Estimate estimate = new Estimate(StringUtils.formatUserName(userName), estimateValue);
        sessionManager.registerEstimate(sessionId, estimate);
    }
}

