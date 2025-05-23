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
    vm.onLogoFileChange = onLogoFileChange;
    vm.addButtonFromFields = addButtonFromFields;
    vm.saveAllButtons = saveAllButtons;
    vm.iconOptions = [
      'bi-calendar-event',
      'bi-puzzle',
      'bi-receipt',
      'bi-shop',
      'bi-hash',
      'bi-chat-dots',
      'bi-star',
      'bi-star-fill',
      'bi-coin',
      'bi-gear',
      'bi-box-arrow-right',
      'bi-arrow-left',
      'bi-upload',
      'bi-clock-history',
      'bi-patch-check',
      'bi-check-circle-fill'
    ];
    vm.iconModalOpen = false;
    vm.iconModalTarget = null;
    vm.openIconModal = function(target) {
      vm.iconModalOpen = true;
      if (target === 'new') {
        vm.iconModalTarget = 'new';
      } else {
        vm.iconModalTarget = target;
      }
    };
    vm.closeIconModal = function() {
      vm.iconModalOpen = false;
      vm.iconModalTarget = null;
    };
    vm.selectIcon = function(icon) {
      if (vm.iconModalTarget === 'new') {
        vm.newButtonIcon = icon;
      } else if (vm.iconModalTarget) {
        vm.iconModalTarget.icon = icon;
      }
      vm.closeIconModal();
    };
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
        // Broadcast logo change so all views update
        $scope.$root.$broadcast('theme-logo-updated', vm.themeConfig.logo);
        alert('Cores e logo salvos!');
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
    var defaultDashboardButtons = [
      { label: 'Próximos eventos', icon: 'bi-calendar-event', route: '/events', visible: true, isDefault: true },
      { label: 'Fidelidade', icon: 'bi-puzzle', route: '/fidelidade', visible: true, isDefault: true },
      { label: 'Registrar compra', icon: 'bi-receipt', route: '/register-purchase', visible: true, isDefault: true },
      { label: 'Loja', icon: 'bi-shop', route: '/virtual-goods', visible: true, isDefault: true },
      { label: 'Rede Social', icon: 'bi-hash', route: '/social', visible: true, isDefault: true },
      { label: 'Quiz - Teste seu conhecimento!', icon: 'bi-chat-dots', route: '/quiz', visible: true, isDefault: true }
    ];
    function mergeDashboardButtons() {
      var stored = JSON.parse(localStorage.getItem('admin_dashboardButtons') || '[]');
      var all = defaultDashboardButtons.map(function(def) {
        var found = stored.find(function(btn) { return btn.route === def.route; });
        return found ? Object.assign({}, def, found) : def;
      });
      // Add custom buttons (not default)
      stored.forEach(function(btn) {
        if (!btn.isDefault) all.push(btn);
      });
      return all; // Do not filter by visible in admin
    }
    vm.dashboardButtons = mergeDashboardButtons();
    function saveButton(btn) {
      var stored = JSON.parse(localStorage.getItem('admin_dashboardButtons') || '[]');
      if (btn.isDefault) {
        // Only update visibility for default buttons
        var idx = stored.findIndex(function(b) { return b.route === btn.route && b.isDefault; });
        if (idx !== -1) stored[idx] = btn;
        else stored.push(btn);
      } else {
        var idx = stored.indexOf(btn);
        if(idx === -1) stored.push(btn);
        else stored[idx] = btn;
      }
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(stored));
      alert('Botão salvo!');
      vm.dashboardButtons = mergeDashboardButtons();
    }
    function deleteButton(btn) {
      if (btn.isDefault) return; // Can't delete default
      var stored = JSON.parse(localStorage.getItem('admin_dashboardButtons') || '[]');
      stored = stored.filter(function(b) { return b !== btn; });
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(stored));
      vm.dashboardButtons = mergeDashboardButtons();
    }
    function addButton() {
      vm.dashboardButtons.push({ label: '', icon: '', route: '', visible: true, isDefault: false });
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
    function onLogoFileChange(input) {
      var file = input.files[0];
      if (!file) return;
      vm.loadingTheme = true;
      var formData = new FormData();
      formData.append('file', file);
      formData.append('extra', JSON.stringify({ session: 'images', transform: [{ stage: 'size', width: 350, height: 350 }] }));
      $http({
        method: 'POST',
        url: 'https://service2.funifier.com/v3/upload/image',
        headers: {
          'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
          'Content-Type': undefined
        },
        data: formData,
        transformRequest: angular.identity
      }).then(function(response) {
        if (response.data && response.data.uploads && response.data.uploads[0] && response.data.uploads[0].url) {
          vm.themeConfig.logo = response.data.uploads[0].url;
        } else {
          alert('Erro ao obter URL da imagem enviada.');
        }
      }).catch(function() {
        alert('Erro ao enviar imagem.');
      }).finally(function() {
        vm.loadingTheme = false;
        $scope.$applyAsync();
      });
    }
    function addButtonFromFields() {
      if (!vm.newButtonLabel || !vm.newButtonIcon || !vm.newButtonRoute) return;
      vm.dashboardButtons.push({
        label: vm.newButtonLabel,
        icon: vm.newButtonIcon,
        route: vm.newButtonRoute,
        visible: true,
        isDefault: false
      });
      // Save to localStorage
      var stored = JSON.parse(localStorage.getItem('admin_dashboardButtons') || '[]');
      stored.push({
        label: vm.newButtonLabel,
        icon: vm.newButtonIcon,
        route: vm.newButtonRoute,
        visible: true,
        isDefault: false
      });
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(stored));
      vm.newButtonLabel = '';
      vm.newButtonIcon = '';
      vm.newButtonRoute = '';
      vm.dashboardButtons = mergeDashboardButtons();
    }
    function saveAllButtons() {
      // Only store custom buttons and visibility overrides for defaults
      var stored = [];
      vm.dashboardButtons.forEach(function(btn) {
        if (btn.isDefault) {
          // Only store if visibility changed from default (true)
          if (btn.visible === false) {
            stored.push({ route: btn.route, visible: false, isDefault: true });
          }
        } else {
          stored.push(btn);
        }
      });
      localStorage.setItem('admin_dashboardButtons', JSON.stringify(stored));
      alert('Botões salvos!');
      vm.dashboardButtons = mergeDashboardButtons();
    }
    // Load theme config from Funifier on controller init
    ThemeConfigService.getConfig().then(function(cfg) {
      vm.themeConfig = angular.copy(cfg);
      if (typeof vm.themeConfig.showStudioLogo === 'undefined') {
        vm.themeConfig.showStudioLogo = true;
      }
      vm.loadingTheme = false;
      $scope.$applyAsync();
    });
  }
})(); 