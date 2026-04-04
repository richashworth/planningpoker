package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AppController {

    @RequestMapping(value = "version", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getAppVersion() {
        String version = PlanningPokerApplication.class.getPackage().getImplementationVersion();
        return version != null ? version : "dev";
    }

}
