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
    $scope.legalEstimates = [0.5, 1, 2, 3, 5, 8, 13, 20, 100];
    $scope.votingResults = [];
    $scope.resultsdata = [];
    $scope.isAdmin = false;


    $scope.labels = $scope.legalEstimates.map(String);

    // $scope.stompClient.debug = null;

    $scope.joinSession = function () {
        $http({
            method: 'GET',
            url: '/validateSession',
            params: {
                sessionId: $scope.sessionId,
                userName: $scope.userName
            }
        }).then(function successCallback(response) {
            $scope.socket = new SockJS('/stomp');
            $scope.stompClient = Stomp.over($scope.socket);
            $scope.stompClient.connect({}, function (frame) {
                $scope.destination = "/topic/message/" + $scope.sessionId;
                $scope.stompClient.subscribe($scope.destination, function (data) {
                    $scope.$apply(function () {
                        var message = JSON.parse(data.body);
                        $scope.resultsdata = $scope.aggregateResults(message);
                    });
                });
            });
            $scope.inSession = true;
        }, function errorCallback(response) {
            alert("Session " + $scope.sessionId + " has not yet been started!\n" +
                "Please try again in a few seconds, or create a new session.")
        });
    };

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
            $scope.socket = new SockJS('/stomp');
            $scope.stompClient = Stomp.over($scope.socket);
            $scope.stompClient.connect({}, function (frame) {
                $scope.destination = "/topic/message/" + response;
                $scope.stompClient.subscribe($scope.destination, function (data) {
                    $scope.$apply(function () {
                        var message = JSON.parse(data.body);
                        $scope.resultsdata = $scope.aggregateResults(message);
                    });
                });
            });
        });
    };

    $scope.vote = function (estimateValue) {
        $http({
            method: 'POST',
            url: '/vote',
            params: {
                sessionId: $scope.sessionId,
                userName: $scope.userName,
                estimateValue: estimateValue
            }
        }).then(function successCallback(response) {
                $scope.voted = true;
            },
            function errorCallback(response) {
                alert("Session " + sessionId + " is not currently active. Please refresh your page.")
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
        $scope.votingResults = result.sort(function (a, b) {
            return a.estimateValue > b.estimateValue
        });
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

