var app = angular.module('app', []);
app.controller('appController', function ($scope, $http) {
    $scope.data = [];
    $scope.is_upload = false;
    $scope.upload_path = "";
    $scope.currentNode = "";
    $scope.updateData = function () {
      var zTree = $.fn.zTree.getZTreeObj("tree")
      $scope.data.data = zTree.getNodes();
      $http.post('/api/saveStorageTree', {data: $scope.data}).success(function (data) {
        console.log(data);
      });
    }
    $http.get('/api/getStorageData').success(function (data) {
        $scope.data = data;
        $.fn.zTree.init($("#tree"), {
          edit: {
              enable: true,
              showRemoveBtn: false,
              showRenameBtn: false
          },
          view: {
            fontCss: {
              'font-family': 'inherit'
            }
          }
        }, $scope.data.data);
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
  $scope.newDir = function () {
    var zTree = $.fn.zTree.getZTreeObj("tree"),
        nodes = zTree.getSelectedNodes(),
        treeNode = nodes[0];
    if (treeNode && !treeNode.isParent) return;
    var name = "New Folder";
    if (treeNode) {
      if (treeNode.children && treeNode.children.length > 0) name += '(' + treeNode.children.length + ')'; 
        treeNode = zTree.addNodes(treeNode, {isParent:true, name: name});
    } else {
        if (zTree.getNodes().length > 0) name += '(' + zTree.getNodes().length + ')';
        treeNode = zTree.addNodes(null, {isParent:true, name: name});
    }
//    if (treeNode) {
//        zTree.editName(treeNode[0]);
//    }
    $scope.updateData();
  }
  $scope.upload = function () {
    var zTree = $.fn.zTree.getZTreeObj("tree"),
        nodes = zTree.getSelectedNodes(),
        treeNode = nodes[0];
    if (treeNode && !treeNode.isParent) return;
    $scope.is_upload=true;
    $scope.upload_path = '/';
    $scope.currentNode = treeNode;
    while (treeNode) {
      $scope.upload_path = '/' + treeNode.name + $scope.upload_path;
      treeNode = treeNode.getParentNode();
    }
  }
  $scope.uploadSuccess = function () {
    var name = $('#file_name').val();
    var size = $('#file_size').val();
    $scope.data.remain -= size;
    var zTree = $.fn.zTree.getZTreeObj("tree");
    if ($scope.currentNode) {
      zTree.addNodes($scope.currentNode, {name: name});
    }
    else {
      zTree.addNodes(null, {name: name});
    }
    $scope.updateData();
  }
  $scope.delete = function () {
    var zTree = $.fn.zTree.getZTreeObj("tree"),
        nodes = zTree.getSelectedNodes(),
        treeNode = nodes[0];
    if (!treeNode) return;
    zTree.removeNode(treeNode);
    $scope.updateData();
  }
  $scope.download = function () {
    var path = '';
    var zTree = $.fn.zTree.getZTreeObj("tree"),
    nodes = zTree.getSelectedNodes(),
    treeNode = nodes[0];
    if (!treeNode || treeNode.isParent) return;
    while (treeNode) {
      path = '/' + treeNode.name + path;
      treeNode = treeNode.getParentNode();
    }
    $('#download_link').attr('href', '/download?path=' + path);
    $('#download_link')[0].click();
//    window.open('/download' + path);
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