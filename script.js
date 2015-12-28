"use strict";

var twitchApp = angular.module('twitchApp', []);

twitchApp.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

twitchApp.filter('myLimit', ['$filter', function ($filter) {
    return function (text, nbChars) {
        var newText = new String(text);
        var result = $filter('limitTo')(text, nbChars);
        if (newText.length > nbChars)
            result += '...';

        return result;
    };
}]);

twitchApp.controller('twitchController', ['$scope', '$interval', '$http', function ($scope, $interval, $http) {
    function getViewersTotal (callback) {
        $http.get('https://api.twitch.tv/kraken/streams/summary').then(function (response) {
            callback(response.data.viewers);
        });
    }

    function selectStream(link, viewerNb, callback) {
        var selectedStream;
        var remainingViewers = viewerNb;
        $http.get(link).then(function (response) {
            var streams = response.data.streams;
            for (var stream of streams) {
                if (stream.viewers > remainingViewers) {
                    selectedStream = stream;
                    break;
                }
                remainingViewers -= stream.viewers;
            }

            if (selectedStream)
                callback(selectedStream);
            else
                selectStream(response.data._links.next, remainingViewers, callback);
        });
    }

    var nextStream;
    $scope.loadingNextStream = false;
    function selectRandomStream () {
        $scope.loadingNextStream = true;
        console.log('updating');
        getViewersTotal(function (viewersTotal) {
            var viewerNb = Math.random() * viewersTotal * 0.90;
            selectStream('https://api.twitch.tv/kraken/streams?limit=100', viewerNb, function (stream) {
                nextStream = stream;
                console.log('finished updating');
                $scope.loadingNextStream = false;
            });
        });
    }

    $scope.updateStream = function () {
        $scope.selectedStream = nextStream;
        nextStream = false;
        $scope.lastStreamUpdate = new Date();
    }

    function updateTimer () {
        if (!nextStream && !$scope.loadingNextStream)
            selectRandomStream();

        if ($scope.autoSwitch && nextStream && !$scope.loadingNextStream && $scope.remainingTime() <= 0)
            $scope.updateStream();
    }

    $scope.lastStreamUpdate = new Date(0);

    $scope.remainingTime = function () {
        return $scope.autoSwitchDelay - (new Date() - $scope.lastStreamUpdate) / 1000;
    };

    $scope.autoSwitch = true;

    $scope.autoSwitchDelay = 60;

    $interval(updateTimer, 1000);
}]);
