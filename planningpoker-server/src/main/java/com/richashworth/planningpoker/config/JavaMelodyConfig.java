package com.richashworth.planningpoker.config;

import net.bull.javamelody.*;
import org.springframework.aop.support.annotation.AnnotationMatchingPointcut;
import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.boot.context.embedded.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.DispatcherType;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;

@Configuration
@SuppressWarnings("javadoc")
public class JavaMelodyConfig implements ServletContextInitializer {
    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        servletContext.addListener(new SessionListener());
    }

    @Bean
    public FilterRegistrationBean javaMelody() {
        final FilterRegistrationBean javaMelody = new FilterRegistrationBean();
        javaMelody.setFilter(new MonitoringFilter());
        javaMelody.setAsyncSupported(true);
        javaMelody.setName("javamelody");
        javaMelody.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ASYNC);

        // see the list of parameters:
        // https://github.com/javamelody/javamelody/wiki/UserGuide#6-optional-parameters
        javaMelody.addInitParameter(Parameter.LOG.getCode(), Boolean.toString(false));
        // to exclude images, css, fonts and js urls from the monitoring:
        javaMelody.addInitParameter(Parameter.URL_EXCLUDE_PATTERN.getCode(), "(/webjars/.*|/css/.*|/images/.*|/fonts/.*|/js/.*)");
        // to add basic auth:
        //  javaMelody.addInitParameter(Parameter.AUTHORIZED_USERS.getCode(), "admin:pwd");
        // to change the default storage directory:
        // javaMelody.addInitParameter(Parameter.STORAGE_DIRECTORY.getCode(), "/tmp/javamelody");

        javaMelody.addUrlPatterns("/*");
        return javaMelody;
    }

    // monitoring of jdbc datasources:
    @Bean
    public SpringDataSourceBeanPostProcessor monitoringDataSourceBeanPostProcessor() {
        SpringDataSourceBeanPostProcessor processor = new SpringDataSourceBeanPostProcessor();
        processor.setExcludedDatasources(null);
        return processor;
    }

    // monitoring of beans or methods having @MonitoredWithSpring:
    @Bean
    public MonitoringSpringAdvisor monitoringAdvisor() {
        final MonitoringSpringAdvisor interceptor = new MonitoringSpringAdvisor();
        interceptor.setPointcut(new MonitoredWithAnnotationPointcut());
        return interceptor;
    }

    // monitoring of all services and controllers (even without having @MonitoredWithSpring):
    @Bean
    public MonitoringSpringAdvisor springServiceMonitoringAdvisor() {
        final MonitoringSpringAdvisor interceptor = new MonitoringSpringAdvisor();
        interceptor.setPointcut(new AnnotationMatchingPointcut(Service.class));
        return interceptor;
    }

    @Bean
    public MonitoringSpringAdvisor springControllerMonitoringAdvisor() {
        final MonitoringSpringAdvisor interceptor = new MonitoringSpringAdvisor();
        interceptor.setPointcut(new AnnotationMatchingPointcut(Controller.class));
        return interceptor;
    }

    @Bean
    public MonitoringSpringAdvisor springRestControllerMonitoringAdvisor() {
        final MonitoringSpringAdvisor interceptor = new MonitoringSpringAdvisor();
        interceptor.setPointcut(new AnnotationMatchingPointcut(RestController.class));
        return interceptor;
    }
}
