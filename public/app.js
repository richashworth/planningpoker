var PlanningPoker = angular.module('PlanningPoker', ['emguo.poller']);

PlanningPoker.controller('UserCtrl', ['$scope', '$http', 'poller', function ($scope, $http, poller) {
    $scope.userName = '';
    $scope.inSession = false;
    $scope.voted = false;
    $scope.legalEstimates = [0.5, 1, 2, 3, 5, 8, 13, 20, 100];

    $scope.joinSession = function () {
        $http({
            method: 'GET',
            url: '/validateSession',
            params: {sessionId: $scope.sessionId}
        }).then(function successCallback(response) {
            $scope.inSession = true;
        }, function errorCallback(response) {
            console.log("error!!!");
            alert("Session " + $scope.sessionId + " has not yet been started!\n" +
                "Please try again in a few seconds, or create a new session.");
        });
    };

    $scope.createSession = function () {
        $http({
            method: 'GET',
            url: '/createSession',
        }).success(function (response) {
            $scope.inSession = true;
            $scope.sessionId = response;
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
        }).success(function (response) {
            $scope.voted = true;
        });
        // Get poller.
        var myPoller = poller.get('results', {
            // action: 'jsonp',
            delay: 1000,
            argumentsArray: [
                {
                    params: {
                        sessionId: $scope.sessionId,
                    },
                }
            ]
        });
        myPoller.promise.then(
            null,null,
            function (result) {
                console.log("hi");
                $scope.votingResults = JSON.stringify(result.data);
            }
        );
    }

}]);


