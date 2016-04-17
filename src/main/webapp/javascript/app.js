var PlanningPoker = angular.module('PlanningPoker', ['chart.js', 'emguo.poller']);

PlanningPoker.config(['$httpProvider', function ($httpProvider) {
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }

    //prevent IE caching AJAX requests
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
}]);

PlanningPoker.controller('PokerCtrl', ['$scope', '$http', 'poller', function ($scope, $http, poller) {
    $scope.userName = '';
    $scope.inSession = false;
    $scope.voted = false;
    $scope.legalEstimates = [0.5, 1, 2, 3, 5, 8, 13, 20, 100];
    $scope.votingResults = [];
    $scope.resultsdata = [];
    $scope.isAdmin = false;

    $scope.labels = $scope.legalEstimates.map(String);

    $scope.joinSession = function () {
        $http({
            method: 'GET',
            url: '/validateSession',
            params: {
                sessionId: $scope.sessionId,
                userName: $scope.userName
            }
        }).then(function successCallback(response) {
                $scope.inSession = true;
            }, function errorCallback(response) {
                alert("Session " + $scope.sessionId + " has not yet been started!\n" +
                    "Please try again in a few seconds, or create a new session.");
            }
        );
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
        });
    };

    $scope.vote = function (estimateValue) {
        $scope.voted = false;
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
                // Get poller.
                var myPoller = poller.get('results', {
                    delay: 500,
                    argumentsArray: [
                        {
                            params: {
                                sessionId: $scope.sessionId
                            }
                        }
                    ]
                });
                myPoller.promise.then(
                    null, null,
                    function (result) {

                        if (result.data.length == 0) {
                            $scope.voted = false;
                        }
                        ;

                        $scope.votingResults = result.data.sort(function (a, b) {
                            return a.estimateValue > b.estimateValue;
                        });

                        $scope.transformed = $scope.votingResults.map(function (val) {
                            return val.estimateValue;
                        });

                        $scope.resultsdata = $scope.legalEstimates.map(function (x) {
                            return $scope.transformed.filter(function (y) {
                                return x == y;
                            }).length;
                        });
                    }
                );
            },
            function errorCallback(response) {
                alert("Session is not currently active. Please refresh your page.")
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
        });
    };

}]);
