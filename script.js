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
    function selectRandomStream (callback) {
        $scope.loadingNextStream = true;
        getViewersTotal(function (viewersTotal) {
            var viewerNb = Math.random() * viewersTotal * 0.90;
            selectStream('https://api.twitch.tv/kraken/streams?limit=100', viewerNb, function (stream) {
                nextStream = stream;
                $scope.loadingNextStream = false;
                if (callback) {
                    callback();
                }
            });
        });
    }

    $scope.updateStream = function () {
        $scope.selectedStream = nextStream;
        nextStream = false;
    }

    function updateTimer () {
        if (!nextStream && !$scope.loadingNextStream)
            selectRandomStream();
    }

    selectRandomStream(function () {
        $scope.updateStream();
    });

    $interval(updateTimer, 1000);
}]);
