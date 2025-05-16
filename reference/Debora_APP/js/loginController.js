// Controller responsável pelo login do usuário
angular.module('interstellarApp')
  .controller('LoginController', ['$scope', '$http', '$location', '$timeout', function($scope, $http, $location, $timeout) {
    $scope.auth = {
      username: '',
      password: ''
    };
    $scope.loginError = '';
    $scope.loading = false;

    $scope.login = function() {
      $scope.loading = true;
      $scope.loginError = '';
      var req = {
        method: 'POST',
        url: 'https://service2.funifier.com/v3/auth/token',
        headers: {
          "Authorization": "Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAD3LQQrCMBCF4avIrLOwSZoR94Lg0gPINJlCIJiQpGoR7-6g0N3j4_1voBIvvMIR3GHv9RhYG40z2tmQwSnYARQ0nwvLpTKFG6Wkds8aO_9n4MTbpk4TNZaGvM_LvUt1uq5n_6hiS-O6QRaIJIcB7ehQW-sU8Kv8wGkUcZ8vhlvpRaAAAAA.MCx82fJC_XLprdlF_Y5m7ors7H9HOErC0mftoyxgqKoi5LNV9sZ3GkijyoOhZGHtrWPWRzGzplUNtESitAhU-A",
          "Content-Type": "application/json"
        },
        data: {
          "apiKey": "680c25de2327f74f3a37bd41",
          "grant_type": "password",
          "username": $scope.auth.username,
          "password": $scope.auth.password
        }
      };
      $http(req).then(
        function (response) {
          if(response.data && response.data.access_token) {
            localStorage.setItem('token', 'Bearer ' + response.data.access_token);
            $location.path('/home');
          } else {
            $scope.loginError = 'Usuário ou senha inválidos.';
          }
          $scope.loading = false;
        },
        function (err) {
          $scope.loginError = 'Usuário ou senha inválidos.';
          $scope.loading = false;
        }
      );
    };

    // Controle do modal de cadastro
    $scope.signupModalOpen = false;
    $scope.signup = {};
    $scope.signupError = '';
    $scope.signupSuccess = '';

    $scope.openSignupModal = function() {
      $scope.signupModalOpen = true;
      $scope.signup = {};
      $scope.signupError = '';
      $scope.signupSuccess = '';
    };
    $scope.closeSignupModal = function() {
      $scope.signupModalOpen = false;
    };
    $scope.cadastrar = function() {
      $scope.signupError = '';
      $scope.signupSuccess = '';
      if (!$scope.signup.nome || !$scope.signup.cpf || !$scope.signup.telefone || !$scope.signup.email || !$scope.signup.senha) {
        $scope.signupError = 'Preencha todos os campos.';
        return;
      }
      if (!$scope.signup.aceitoTermos) {
        $scope.signupError = 'Você deve aceitar os termos de uso.';
        return;
      }
      // Chamada real à API de cadastro Funifier usando token dinâmico
      // Token fixo fornecido pelo usuário para cadastro
      var token = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE3NTQrDIBCG4asU11lEo47pFbrsAcKok1YQIsb0h9K7d0gpdPcyPHzzEljSiZ7iKKzrgzKR1KBgBj0POICPWoqOTTlTqNR2Jk0Pyv-xUWEYma1hKcSkEsYJc-4O95oafTNSpl_fUm0b5suyxHUqWw1XXIkJNvRcPJWQf0nQ1hoJznaCHmU_gDLWOPv-ABdGV2a5AAAA.-82U3lRCmbtVOHrsRwBA-rn-jtLVyfXxNjZuhbkq7jQTc6PZt9oU5zXRJSap8-_jESwREPCXtPmoMqbQnvesCg';
      var req = {
        method: 'POST',
        url: 'https://service2.funifier.com/v3/player',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        data: {
          "_id": $scope.signup.email.split('@')[0], // ou outro identificador único
          "name": $scope.signup.nome,
          "cpf": $scope.signup.cpf,
          "telefone": $scope.signup.telefone,
          "email": $scope.signup.email,
          "password": $scope.signup.senha,
          "image": {
            "small": {"url": "https://my.funifier.com/images/funny.png"},
            "medium": {"url": "https://my.funifier.com/images/funny.png"},
            "original": {"url": "https://my.funifier.com/images/funny.png"}
          },
          "teams": [],
          "friends": [],
          "extra": {}
        }
      };
      $http(req).then(
        function (response) {
          $scope.signupSuccess = 'Cadastro realizado com sucesso! Faça login para continuar.';
          $scope.signupError = '';
          // Fecha o modal após 1.5s e limpa os campos usando $timeout (AngularJS)
          $timeout(function() {
            $scope.signupModalOpen = false;
            $scope.signup = {};
          }, 1500);
        },
        function (err) {
          if (err.data && err.data.message) {
            $scope.signupError = 'Erro ao cadastrar: ' + err.data.message;
          } else {
            $scope.signupError = 'Erro ao cadastrar. Tente novamente.';
          }
          $scope.signupSuccess = '';
          // Modal permanece aberto em caso de erro
        }
      );
    };

    $scope.goToSignup = function() {
      $location.path('/signup');
    };
    $scope.goToForgotPassword = function() {
      // Implemente a navegação para recuperação de senha se desejar
      alert('Funcionalidade de recuperação de senha ainda não implementada.');
    };
  }]);
