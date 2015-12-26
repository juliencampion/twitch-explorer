"use strict";

var twitchApp = angular.module('twitchApp', []);

twitchApp.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

twitchApp.controller('twitchController', ['$scope', '$interval', function ($scope, $interval) {
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

    var oldStream;

    function updateStream () {
        $scope.updatingStream = true;
        $.get('https://api.twitch.tv/kraken/streams?limit=100', {}, function (data) {
                var selectedStream = selectRandomStream(data.streams);
                while (oldStream && oldStream.channel.display_name === selectedStream.channel.display_name) {
                    selectedStream = selectRandomStream(data.streams);
                }
                oldStream = selectedStream;

                $scope.selectedStream = selectedStream;
                $scope.updatingStream = false;
                $scope.lastStreamUpdate = new Date();
                });
    }

    function updateTimer () {
        if (!$scope.updatingStream && $scope.remainingTime() <= 0)
            updateStream();
    }

    $scope.updatingStream = false;

    $scope.remainingTime = function () {
        return 60 - (new Date() - $scope.lastStreamUpdate) / 1000;
    };

    updateStream();
    $interval(updateTimer, 1000);
}]);
