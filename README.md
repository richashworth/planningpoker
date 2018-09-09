[![Build Status](https://travis-ci.org/richashworth/planningpoker.svg?branch=master)](https://travis-ci.org/richashworth/planningpoker)
[![codecov](https://codecov.io/gh/richashworth/planningpoker/branch/master/graph/badge.svg)](https://codecov.io/gh/richashworth/planningpoker)
![Heroku](http://heroku-badge.herokuapp.com/?app=planningpoker-tool&style=flat&svg=1)

# Planning Poker

A simple web-based planning poker game. See [this blog post](http://richashworth.com/2016/08/agile-estimation-for-distributed-teams/) for more information.

## Demo
https://planningpoker-tool.herokuapp.com

<img src="https://github.com/richashworth/planningpoker/raw/master/doc/demo.gif" width="750">

## Building

To build from the source code

`./gradlew`

## Running

Both the web and api apps can be started using docker-compose:

`docker-compose up`


Alternatively, binaries for the latest release can be downloaded [here](https://github.com/richashworth/planningpoker/releases/latest). These can be run with:

`java -jar planningpoker-<version>.jar`
