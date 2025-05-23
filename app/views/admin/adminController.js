(function() {
  'use strict';
  angular.module('app').controller('AdminController', AdminController);
  AdminController.$inject = ['$scope', '$http', '$window', 'ThemeConfigService'];
  function AdminController($scope, $http, $window, ThemeConfigService) {
    var vm = this;
    vm.loggedIn = false;
    vm.user = '';
    vm.pass = '';
    vm.error = '';
    vm.themeConfig = {};
    vm.loadingTheme = true;
    vm.themeColor = localStorage.getItem('admin_themeColor') || '#ff2e93';
    vm.secondaryColor = localStorage.getItem('admin_secondaryColor') || '#6a0033';
    vm.logoUrl = localStorage.getItem('admin_logoUrl') || '';
    vm.logoFile = null;
    vm.dashboardButtons = JSON.parse(localStorage.getItem('admin_dashboardButtons') || '[]');
    vm.successMessage = localStorage.getItem('admin_successMessage') || '';
    vm.stats = { purchases: 0, activePlayers: 0, cashbackDistributed: 0, cashbackLost: 0, cashbackUsed: 0, pointsGained: 0, pointsUsed: 0 };
    vm.challenges = JSON.parse(localStorage.getItem('admin_challenges') || '[]');
    vm.actionPlayerId = '';
    vm.actionType = '';
    vm.login = login;
    vm.saveColors = saveColors;
    vm.resetToDefault = resetToDefault;
    vm.saveLogo = saveLogo;
    vm.saveButton = saveButton;
    vm.deleteButton = deleteButton;
    vm.addButton = addButton;
    vm.saveSuccessMessage = saveSuccessMessage;
    vm.refreshStats = refreshStats;
    vm.saveChallenge = saveChallenge;
    vm.addChallenge = addChallenge;
    vm.createActionLog = createActionLog;
    // --- Auth ---
    function login() {
      if(vm.user === 'admin' && vm.pass === 'P0rquinh@') {
        vm.loggedIn = true;
        vm.error = '';
      } else {
        vm.error = 'Usuário ou senha incorretos';
      }
    }
    // --- Theme Colors ---
    function saveColors() {
      vm.loadingTheme = true;
      ThemeConfigService.saveConfig(vm.themeConfig).then(function() {
        ThemeConfigService.applyConfig(vm.themeConfig);
        vm.loadingTheme = false;
        alert('Cores salvas!');
        $scope.$applyAsync();
      });
    }
    function resetToDefault() {
      var def = ThemeConfigService.getDefaultConfig();
      vm.themeConfig = angular.copy(def);
      saveColors();
    }
    // --- Logo ---
    function saveLogo() {
      if(vm.logoFile) {
        // Simulate upload and get URL
        var reader = new FileReader();
        reader.onload = function(e) {
          vm.logoUrl = e.target.result;
          localStorage.setItem('admin_logoUrl', vm.logoUrl);
          $scope.$apply();
          alert('Logo salva!');
        };
        reader.readAsDataURL(vm.logoFile);
      } else if(vm.logoUrl) {
        localStorage.setItem('admin_logoUrl', vm.logoUrl);
        alert('Logo salva!');
      }
    }
    // --- Dashboard Buttons ---
    function saveButton(btn) {
      var idx = vm.dashboardButtons.indexOf(btn);
      if(idx === -1) vm.dashboardButtons.push(btn);
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(vm.dashboardButtons));
      alert('Botão salvo!');
    }
    function deleteButton(btn) {
      vm.dashboardButtons = vm.dashboardButtons.filter(function(b) { return b !== btn; });
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(vm.dashboardButtons));
    }
    function addButton() {
      vm.dashboardButtons.push({ label: '', icon: '', route: '', visible: true });
    }
    // --- Success Message ---
    function saveSuccessMessage() {
      localStorage.setItem('admin_successMessage', vm.successMessage);
      alert('Mensagem salva!');
    }
    // --- Stats (Funifier API, Basic Auth) ---
    function refreshStats() {
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      // Purchases
      $http.get('https://service2.funifier.com/v3/player/purchases', { headers: { Authorization: basicAuth } })
        .then(function(resp) { vm.stats.purchases = resp.data.length || 0; });
      // Active players
      $http.get('https://service2.funifier.com/v3/player/active', { headers: { Authorization: basicAuth } })
        .then(function(resp) { vm.stats.activePlayers = resp.data.length || 0; });
      // Cashback distributed/used/lost, points gained/used (placeholders, need real endpoints)
      // ...
    }
    // --- Challenges ---
    function saveChallenge(challenge) {
      var idx = vm.challenges.indexOf(challenge);
      if(idx === -1) vm.challenges.push(challenge);
      localStorage.setItem('admin_challenges', JSON.stringify(vm.challenges));
      alert('Desafio salvo!');
    }
    function addChallenge() {
      vm.challenges.push({ name: '', points: 0 });
    }
    // --- Action Log ---
    function createActionLog() {
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      $http.post('https://service2.funifier.com/v3/activities', { action: vm.actionType, player: vm.actionPlayerId }, { headers: { Authorization: basicAuth } })
        .then(function() { alert('Log criado!'); });
    }
    // Load theme config from Funifier on controller init
    ThemeConfigService.getConfig().then(function(cfg) {
      vm.themeConfig = angular.copy(cfg);
      vm.loadingTheme = false;
      $scope.$applyAsync();
    });
  }
})(); 