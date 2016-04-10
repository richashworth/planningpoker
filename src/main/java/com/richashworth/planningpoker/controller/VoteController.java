package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by rich on 09/04/2016.
 */
@RestController
public class VoteController {

    private final SessionManager sessionManager;

    @Autowired
    public VoteController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @RequestMapping("vote")
    public void vote(
            @RequestParam(name = "sessionId") int sessionId,
            @RequestParam(name = "userName") String userName,
            @RequestParam(name = "estimateValue") int estimateValue
    ) {
        Estimate estimate = new Estimate(userName, estimateValue);
        sessionManager.registerEstimate(sessionId, estimate);
    }
}

