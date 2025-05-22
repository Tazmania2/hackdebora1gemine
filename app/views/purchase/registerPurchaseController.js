(function() {
  'use strict';

  angular
    .module('app')
    .controller('RegisterPurchaseController', RegisterPurchaseController);

  RegisterPurchaseController.$inject = ['$scope', '$http', '$timeout', 'PlayerService'];

  function RegisterPurchaseController($scope, $http, $timeout, PlayerService) {
    var vm = this;
    vm.purchaseValue = null;
    vm.purchaseProof = null;
    vm.loading = false;
    vm.success = false;
    vm.error = null;
    vm.updatedPoints = null;
    vm.updatedCashback = null;
    
    vm.submit = submit;

    function submit() {
      if (!vm.purchaseValue || !vm.purchaseProof) return;
      vm.loading = true;
      vm.error = null;
      vm.success = false;
      // Step 1: Upload image
      var formData = new FormData();
      formData.append('file', vm.purchaseProof);
      $http({
        method: 'POST',
        url: 'https://service2.funifier.com/v3/upload/image',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': undefined // Let browser set multipart boundary
        },
        data: formData,
        transformRequest: angular.identity
      }).then(function(uploadRes) {
        // Step 2: Log action
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
        // Step 3: Fetch updated player status using PlayerService
        return PlayerService.getStatus();
      }).then(function(statusRes) {
        var data = statusRes.data;
        vm.updatedPoints = data.total_points || (data.point_categories && data.point_categories.pontos) || 0;
        vm.updatedCashback = (data.point_categories && data.point_categories.cashback) || 0;
        vm.success = true;
        vm.purchaseValue = null;
        vm.purchaseProof = null;
        $scope.registerPurchaseForm.$setPristine();
        $scope.registerPurchaseForm.$setUntouched();
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