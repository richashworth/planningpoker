package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by Rich Ashworth on 20/08/2016.
 */
@RestController
public class AppController {

    @Value("${feedback.recipient.email}")
    private String feedbackRecipient;

    @RequestMapping(value = "version", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getAppVersion() {
        return PlanningPokerApplication.class.getPackage().getImplementationVersion();
    }

    @RequestMapping(value = "feedbackRecipient", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getFeedbackRecipient() {
        return feedbackRecipient;
    }
}
