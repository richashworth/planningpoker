package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.junit.Assert.assertEquals;

/**
 * Created by Rich Ashworth on 23/08/2016.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(PlanningPokerApplication.class)
public class AppControllerTest {

    @Autowired
    private AppController appController;

    @Test
    public void getFeedbackRecipient() throws Exception {
        assertEquals("richardashworth575@gmail.com", appController.getFeedbackRecipient());
    }

}