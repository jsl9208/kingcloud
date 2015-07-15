var app = angular.module('app', []);
app.controller('appController', function ($scope, $http) {
    $scope.data = [];
    $scope.keyword = "";
    $http.get('/api/getData').success(function (data) {
        $scope.data = data;
    });
    $scope.formatDate = function (rawDate) {
      var date = new Date(rawDate);
      return date.getFullYear() + '/' + ((date.getMonth() + 1) < 10 ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1)) + '/' + (date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()) + ' ' + (date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours()) + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ':' + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    }
    $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
      $('div.code').each(function(i, block) {
        hljs.highlightBlock(block);
      });
    });
  $scope.Date = function (rawDate) {
    return new Date(rawDate);
  }
    $scope.match = function (name) {
      return name.indexOf($scope.keyword) == -1;
    }
    $scope.recharge = function (id, index) {
      var val = $('#recharge_' + id).val();
      $http.post('/recharge', {id: id, value: val}).success(function (data) {
        $scope.data[index] = data;
        $.gritter.add({
            title: '操作成功',
            text: '本次操作为用户<i>' + data.username + '</i> <br> 充值了 <i>' + val + '</i> 元',
            class_name: 'gritter-success gritter-light'
        });
      })
    }
});
app.controller('appStatusController', function ($scope, $http) {
  $scope.user_cnt = 0;
  $scope.server_cnt = 0;
  $scope.total_storage = 0;
  $scope.users = [];
  $http.get('/api/getData').success(function (data) {
      $scope.user_cnt = data.length;
      data.forEach(function (item) {
          $scope.server_cnt += item.servers.length;
          $scope.total_storage += item.storage.remain;
      });
    $scope.total_storage /= 1024*1024*1024;
    $scope.total_storage = $scope.total_storage.toFixed(2);
  });
  $http.get('/api/admin').success(function (data) {
    $scope.users = data;
  });
  $scope.allow = function (id) {
    $http.post('/api/allow', {id: id}).success(function (data) {
      $.gritter.add({
            title: '操作成功',
            text: '本次操作通过了用户<i>' + data.username + '</i> 的注册请求',
            class_name: 'gritter-success gritter-light'
        });
      $http.get('/api/admin').success(function (data) {
        $scope.users = data;
      });
    });
  }
  $scope.deny = function (id) {
    $http.post('/api/deny', {id: id}).success(function (data) {
      $.gritter.add({
            title: '操作成功',
            text: '本次操作拒绝了用户<i>' + data.username + '</i> 的注册请求',
            class_name: 'gritter-success gritter-light'
        });
      $http.get('/api/admin').success(function (data) {
        $scope.users = data;
      });
    });
  }
});
app.directive('onFinishRenderFilters', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function() {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    };
});