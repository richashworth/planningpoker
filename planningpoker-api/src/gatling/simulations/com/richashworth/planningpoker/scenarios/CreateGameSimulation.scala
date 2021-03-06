package com.richashworth.planningpoker.scenarios

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class CreateGameSimulation extends Simulation {

  val createGameScenario = scenario("Create Game")
    .feed(feeder)
    .exec(
      http("create game")
        .post("/createSession")
        .queryParam("userName", "${userName}")
        .check(status.is(200))
    )
  private val feeder = csv("users.txt").random.circular
  private val httpConf = http.baseUrl("http://localhost:9000")

  setUp(createGameScenario.inject(
    rampUsersPerSec(1) to 1000 during (5 seconds)
  ).protocols(httpConf))
}
