"use strict";

var twitchApp = angular.module('twitchApp', []);

twitchApp.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

twitchApp.controller('twitchController', ['$scope', '$interval', '$http', function ($scope, $interval, $http) {
    function selectRandomStream (streams) {
        var viewersTotal = 0;
        for (var stream of streams) {
            viewersTotal += stream.viewers;
        }

        var viewerNb = Math.random() * viewersTotal;

        var selectedStream;
        var remainingViewers = viewerNb;
        for (var stream of streams) {
            if (stream.viewers > remainingViewers) {
                selectedStream = stream;
                break;
            }
            remainingViewers -= stream.viewers;
        }

        return selectedStream;
    }

    $scope.updateStream = function () {
        $scope.updatingStream = true;
        $http.get('https://api.twitch.tv/kraken/streams?limit=100', {}).then(function (response) {
                var selectedStream = selectRandomStream(response.data.streams);
                while ($scope.selectedStream && $scope.selectedStream.channel.display_name === selectedStream.channel.display_name) {
                    selectedStream = selectRandomStream(response.data.streams);
                }

                $scope.selectedStream = selectedStream;
                $scope.updatingStream = false;
                $scope.lastStreamUpdate = new Date();
                console.log(selectedStream);
                });
    }

    function updateTimer () {
        if (!$scope.updatingStream && $scope.remainingTime() <= 0)
            $scope.updateStream();
    }

    $scope.updatingStream = false;

    $scope.remainingTime = function () {
        return 60 - (new Date() - $scope.lastStreamUpdate) / 1000;
    };

    $scope.updateStream();
    $interval(updateTimer, 1000);
}]);
