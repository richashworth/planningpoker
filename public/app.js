var PlanningPoker = angular.module('PlanningPoker', []);

PlanningPoker.controller('UserCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.userName = '';
    $scope.sessionId = '';
    $scope.inSession = false;

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
                "Try again in a few seconds, or create a new session.");
        });
    }
    $scope.vote= function (value) {
        console.log(value);
    }
}]);


