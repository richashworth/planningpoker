package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by Rich Ashworth on 20/08/2016.
 */
@RestController
@CrossOrigin
public class AppController {

    @Value("${feedback.recipient.email}")
    private String feedbackRecipient;

    @RequestMapping(value = "version", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getAppVersion() {
      return "2.0.0-SNAPSHOT";
    }

    @RequestMapping(value = "feedbackRecipient", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getFeedbackRecipient() {
        return feedbackRecipient;
    }
}
