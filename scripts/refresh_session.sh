#!/bin/bash
if [  $# -eq 0 ]
then
        echo -e "\nUsage:\n$0 [sessionId] \n"
else
        curl http://lonrs08783:8080/refresh?sessionId=$1
fi
