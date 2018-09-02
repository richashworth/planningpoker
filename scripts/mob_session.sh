#!/bin/bash
for name in "Tom" "Ursula" "Anuj" "Sam" "Isaac" "David" "Gavin"
do
    echo "${name} is joining session"
    curl -X POST -F "userName=${name}" -F "sessionId=1" https://planningpoker-tool.herokuapp.com/joinSession;
    sleep $((RANDOM % 1))
done

sleep $((RANDOM % 4))

curl -X POST -F "userName=Tom" -F "sessionId=1" -F "estimateValue=2" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Isaac" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=David" -F "sessionId=1" -F "estimateValue=2" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Anuj" -F "sessionId=1" -F "estimateValue=20" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Ursula" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Gavin" -F "sessionId=1" -F "estimateValue=2" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Sam" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))
