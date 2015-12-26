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

    $scope.updatingStream = false;
    function updateStream () {
        $scope.updatingStream = true;
        $.get('https://api.twitch.tv/kraken/streams?limit=100', {}, function (data) {
                console.log(data.streams);
                var selectedStream = selectRandomStream(data.streams);
                while (oldStream && oldStream.channel.display_name === selectedStream.channel.display_name) {
                    selectedStream = selectRandomStream(data.streams);
                }
                oldStream = selectedStream;

                //$('#twitch-player').attr('src', 'http://player.twitch.tv/?channel=' + selectedStream.channel.display_name);
                $scope.selectedStream = selectedStream;
                $scope.streamName = selectedStream.channel.display_name;
                $scope.updatingStream = false;
                });
    }

    $scope.timer = 0;
    function updateTimer () {
        if ($scope.timer === 0) {
            $scope.timer = 60;
            updateStream();
        } else {
            $scope.timer--;
        }
    }

    $interval(updateTimer, 1000);
}]);
