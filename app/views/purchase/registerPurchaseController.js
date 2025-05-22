(function() {
  'use strict';

  angular
    .module('app')
    .controller('RegisterPurchaseController', RegisterPurchaseController);

  RegisterPurchaseController.$inject = ['$scope', '$http', '$timeout', '$location', 'PlayerService'];

  function RegisterPurchaseController($scope, $http, $timeout, $location, PlayerService) {
    var vm = this;
    vm.purchaseValue = null;
    vm.purchaseProof = null;
    vm.purchaseProofPreview = null;
    vm.loading = false;
    vm.success = false;
    vm.error = null;
    vm.updatedPoints = null;
    vm.updatedCashback = null;
    vm.animating = false;
    vm.submit = submit;
    vm.onFileChange = onFileChange;
    vm.isLoggedIn = function() {
      return !!localStorage.getItem('token');
    };
    vm.goBack = function() {
      $location.path('/dashboard');
    };

    function onFileChange(element) {
      var file = element.files[0];
      if (!file) return;
      if (!file.type.match(/^image\//)) {
        vm.error = 'Apenas imagens são permitidas.';
        $scope.$applyAsync();
        return;
      }
      if (file.size > 1024 * 1024) {
        vm.error = 'O tamanho máximo da imagem é 1MB.';
        $scope.$applyAsync();
        return;
      }
      vm.purchaseProof = file;
      var reader = new FileReader();
      reader.onload = function(e) {
        $timeout(function() {
          vm.purchaseProofPreview = e.target.result;
        });
      };
      reader.readAsDataURL(file);
      vm.error = null;
    }

    function submit() {
      if (!vm.purchaseValue || !vm.purchaseProof) {
        vm.error = 'Preencha o valor e envie o comprovante.';
        return;
      }
      vm.loading = true;
      vm.error = null;
      vm.success = false;
      // Step 1: Upload image (Basic token)
      var formData = new FormData();
      formData.append('file', vm.purchaseProof);
      $http({
        method: 'POST',
        url: 'https://service2.funifier.com/v3/upload/image',
        headers: {
          'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
          'Content-Type': undefined
        },
        data: formData,
        transformRequest: angular.identity
      }).then(function(uploadRes) {
        // Step 2: Log action (Bearer token)
        return $http({
          method: 'POST',
          url: 'https://service2.funifier.com/v3/action/log',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
          },
          data: {
            actionId: 'comprar',
            userId: 'me',
            attributes: { valor: vm.purchaseValue }
          }
        });
      }).then(function(logRes) {
        // Step 3: Fetch updated player status
        return PlayerService.getStatus();
      }).then(function(statusRes) {
        var data = statusRes.data;
        vm.updatedPoints = data.total_points || (data.point_categories && data.point_categories.pontos) || 0;
        vm.updatedCashback = (data.point_categories && (data.point_categories.cashback || data.point_categories.misscoins)) || 0;
        vm.success = true;
        vm.animating = true;
        // Animate for 2s, then redirect
        $timeout(function() {
          vm.animating = false;
          $location.path('/dashboard');
        }, 2000);
        vm.purchaseValue = null;
        vm.purchaseProof = null;
        vm.purchaseProofPreview = null;
        if ($scope.registerPurchaseForm) {
          $scope.registerPurchaseForm.$setPristine();
          $scope.registerPurchaseForm.$setUntouched();
        }
      }).catch(function(err) {
        vm.error = 'Erro ao registrar compra. Tente novamente.';
        console.error(err);
      }).finally(function() {
        vm.loading = false;
        $timeout(function() { $scope.$applyAsync(); });
      });
    }
  }
})(); 