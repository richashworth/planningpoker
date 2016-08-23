#!/bin/bash
for userCount in {1..8}
do
    curl --data "sessionId=${1}&userName=User ${userCount}" http://localhost:8080/joinSession;
    curl --data "sessionId=${1}&userName=User ${userCount}&estimateValue=13" http://localhost:8080/vote;
done
