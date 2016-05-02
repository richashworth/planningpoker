var PlanningPoker = angular.module('PlanningPoker', ['chart.js']);

PlanningPoker.config(['$httpProvider', function ($httpProvider) {
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {}
    }
    //prevent IE caching AJAX requests
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
}]);

PlanningPoker.controller('PokerCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.userName = '';
    $scope.inSession = false;
    $scope.voted = false;
    $scope.sessionUsers = [];
    $scope.notVoted = [];
    $scope.votedUsers = [];
    $scope.waitingFor = [];
    $scope.votingResults = [];
    $scope.resultsdata = [];
    $scope.isAdmin = false;

    $scope.legalEstimates = [0.5, 1, 2, 3, 5, 8, 13, 20, 100];
    $scope.labels = $scope.legalEstimates.map(String);

    $scope.createSession = function () {
        $http({
            method: 'POST',
            url: '/createSession',
            params: {
                userName: $scope.userName
            }
        }).success(function (response) {
            $scope.inSession = true;
            $scope.sessionId = response;
            $scope.isAdmin = true;
            $scope.sessionUsers = [$scope.userName];
            var socket = new SockJS('/stomp');
            var stompClient = Stomp.over(socket);
            stompClient.debug = null;
            stompClient.connect({}, function (frame) {
                stompClient.subscribe("/topic/results/" + response, function (data) {
                    $scope.$apply(function () {
                        var message = JSON.parse(data.body);
                        $scope.resultsdata = $scope.aggregateResults(message);
                        $scope.votedUsers = message.map(function (estimate) {
                            return estimate.userName.toUpperCase();
                        });
                        $scope.waitingFor = $scope.notVoted.filter(function (user) {
                            return $scope.votedUsers.indexOf(user.toUpperCase()) < 0;
                        });
                    });
                });
                stompClient.subscribe("/topic/users/" + response, function (data) {
                    $scope.$apply(function () {
                        var users = JSON.parse(data.body);
                        $scope.sessionUsers = users;
                        $scope.notVoted = users;
                        $scope.waitingFor = $scope.notVoted.filter(function (user) {
                            return $scope.votedUsers.indexOf(user.toUpperCase()) < 0;
                        });
                    });
                });
            });
        });
    };

    $scope.joinSession = function () {
        if (!$scope.sessionId) {
            alert("Please enter a valid session ID.")
        } else {
            $scope.sessionUsers = [];
            var socket = new SockJS('/stomp');
            var stompClient = Stomp.over(socket);
            stompClient.debug = null;
            stompClient.connect({}, function (frame) {
                stompClient.subscribe("/topic/users/" + $scope.sessionId, function (data) {
                    $scope.$apply(function () {
                        var users = JSON.parse(data.body);
                        $scope.sessionUsers = users;
                        $scope.notVoted = users;
                        $scope.waitingFor = $scope.notVoted.filter(function (user) {
                            return $scope.votedUsers.indexOf(user.toUpperCase()) < 0;
                        });
                    });
                });
                stompClient.subscribe("/topic/results/" + $scope.sessionId, function (data) {
                    $scope.$apply(function () {
                        var message = JSON.parse(data.body);
                        if (message.length == 0) {
                            $scope.voted = false;
                        } else {
                            $scope.resultsdata = $scope.aggregateResults(message);
                            $scope.votedUsers = message.map(function (estimate) {
                                return estimate.userName.toUpperCase();
                            });
                            $scope.waitingFor = $scope.notVoted.filter(function (user) {
                                return $scope.votedUsers.indexOf(user.toUpperCase()) < 0;
                            });
                        }
                    });
                });
                $http({
                    method: 'POST',
                    url: '/joinSession',
                    params: {
                        sessionId: $scope.sessionId,
                        userName: $scope.userName
                    }
                }).then(function successCallback(response) {
                    $scope.inSession = true;
                }, function errorCallback(response) {
                    console.log(response);
                    if (response.data.message == 'user exists') {
                        alert("A user with that name has already registered for this session.")
                    } else {
                        alert("Session " + $scope.sessionId + " has not yet been started. " +
                            "Please try again in a few seconds, or start a new session as moderator.")
                    }
                });
            });
        }
    };

    $scope.vote = function (estimateValue) {
        $scope.voted = true;
        $http({
            method: 'POST',
            url: '/vote',
            params: {
                sessionId: $scope.sessionId,
                userName: $scope.userName,
                estimateValue: estimateValue
            }
        }).then(
            function successCallback(response) {
            },
            function errorCallback(response) {
                alert("Session " + $scope.sessionId + " is not currently active.");
                $scope.sessionId = undefined;
                $scope.voted = false;
                $scope.inSession = false;
                $scope.isAdmin = false;
            }
        );
    };

    $scope.reset = function () {
        $http({
            method: 'DELETE',
            url: '/reset',
            params: {
                sessionId: $scope.sessionId,
                userName: $scope.userName
            }
        }).success(function (response) {
            $scope.voted = false;
        })
    };

    $scope.aggregateResults = function (result) {
        $scope.votingResults = result;
        var estimates = $scope.votingResults.map(function (val) {
            return val.estimateValue
        });
        return $scope.legalEstimates.map(function (x) {
            return estimates.filter(function (y) {
                return x == y
            }).length
        })
    };

}]);

