(function() {
  'use strict';

  angular
    .module('app')
    .controller('SocialController', SocialController);

  SocialController.$inject = ['$scope', '$http', '$timeout', '$location', 'SuccessMessageService'];

  function SocialController($scope, $http, $timeout, $location, SuccessMessageService) {
    var vm = this;
    vm.handle = '';
    vm.print = null;
    vm.printPreview = null;
    vm.loading = false;
    vm.success = false;
    vm.error = null;
    vm.submit = submit;
    vm.onFileChange = onFileChange;
    vm.goBack = function() { $location.path('/dashboard'); };

    SuccessMessageService.fetchAll();

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
      vm.print = file;
      var reader = new FileReader();
      reader.onload = function(e) {
        $timeout(function() {
          vm.printPreview = e.target.result;
        });
      };
      reader.readAsDataURL(file);
      vm.error = null;
    }

    function submit() {
      if (!vm.handle || !vm.print) {
        vm.error = 'Preencha seu handle e envie o print.';
        return;
      }
      vm.loading = true;
      vm.error = null;
      vm.success = false;
      // Step 1: Upload image (Basic token)
      var formData = new FormData();
      formData.append('file', vm.print);
      formData.append('extra', JSON.stringify({
        session: 'images',
        transform: [{ stage: 'size', width: 350, height: 350 }]
      }));
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
            'Authorization': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          },
          data: {
            actionId: 'compartilhar',
            userId: 'me',
            attributes: { handle: vm.handle }
          }
        });
      }).then(function(logRes) {
        vm.success = SuccessMessageService.get('log_created') || 'Ação registrada com sucesso!';
        vm.loading = false;
        vm.animating = true;
        $timeout(function() {
          vm.animating = false;
          $location.path('/dashboard');
        }, 2000);
        vm.handle = '';
        vm.print = null;
        vm.printPreview = null;
        if ($scope.socialForm) {
          $scope.socialForm.$setPristine();
          $scope.socialForm.$setUntouched();
        }
      }).catch(function(err) {
        vm.error = 'Erro ao registrar ação. Tente novamente.';
        console.error(err);
      }).finally(function() {
        vm.loading = false;
        $timeout(function() { $scope.$applyAsync(); });
      });
    }
  }
})(); 