#!/bin/bash
for name in "Ben" "Tom" "Ursula" "Anuj" "Sam" "Isaac" "David" "Gavin" "Kirsty"
do
    echo "${name} is joining session"
    curl -X POST -F "userName=${name}" -F "sessionId=1" https://planningpoker-tool.herokuapp.com/joinSession;
    sleep $((RANDOM % 1))
done

sleep 2

curl -X POST -F "userName=Tom" -F "sessionId=1" -F "estimateValue=1" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Isaac" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=David" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Anuj" -F "sessionId=1" -F "estimateValue=10" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Ursula" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;

curl -X POST -F "userName=Ben" -F "sessionId=1" -F "estimateValue=5" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Kirsty" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;

curl -X POST -F "userName=Gavin" -F "sessionId=1" -F "estimateValue=1" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))

curl -X POST -F "userName=Sam" -F "sessionId=1" -F "estimateValue=3" https://planningpoker-tool.herokuapp.com/vote;
sleep $((RANDOM % 1))
