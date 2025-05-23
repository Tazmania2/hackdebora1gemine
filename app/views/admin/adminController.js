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
    vm.deleteButton = deleteButton;
    vm.addButtonFromFields = addButtonFromFields;
    vm.saveSuccessMessage = saveSuccessMessage;
    vm.refreshStats = refreshStats;
    vm.saveChallenge = saveChallenge;
    vm.addChallenge = addChallenge;
    vm.createActionLog = createActionLog;
    vm.onLogoFileChange = onLogoFileChange;
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
    // --- Dashboard Buttons (Funifier sync) ---
    var FUNIFIER_COLLECTION = 'dashboard_buttons__c';
    var FUNIFIER_API = 'https://service2.funifier.com/v3/collection/' + FUNIFIER_COLLECTION;
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    vm.loadingButtons = true;
    vm.dashboardButtons = [];
    // Default buttons (always present)
    var defaultDashboardButtons = [
      { id: 'default-events', label: 'Próximos eventos', icon: 'bi-calendar-event', route: '/events', visible: true, isDefault: true },
      { id: 'default-fidelidade', label: 'Fidelidade', icon: 'bi-puzzle', route: '/fidelidade', visible: true, isDefault: true },
      { id: 'default-register', label: 'Registrar compra', icon: 'bi-receipt', route: '/register-purchase', visible: true, isDefault: true },
      { id: 'default-store', label: 'Loja', icon: 'bi-shop', route: '/virtual-goods', visible: true, isDefault: true },
      { id: 'default-social', label: 'Rede Social', icon: 'bi-hash', route: '/social', visible: true, isDefault: true },
      { id: 'default-quiz', label: 'Quiz - Teste seu conhecimento!', icon: 'bi-chat-dots', route: '/quiz', visible: true, isDefault: true }
    ];
    // Load from Funifier
    function loadDashboardButtons() {
      vm.loadingButtons = true;
      $http.get(FUNIFIER_API, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          var data = (resp.data && resp.data.value) ? resp.data.value : [];
          // Merge defaults: use override if present, else visible: true
          var all = defaultDashboardButtons.map(function(def) {
            var found = data.find(function(btn) { return btn.id === def.id; });
            if (found && typeof found.visible !== 'undefined') {
              return Object.assign({}, def, { visible: found.visible });
            }
            return def;
          });
          // Add all custom buttons (not default)
          data.forEach(function(btn) {
            if (!btn.isDefault) all.push(btn);
          });
          vm.dashboardButtons = all;
        })
        .catch(function() {
          alert('Erro ao carregar botões do dashboard do Funifier.');
        })
        .finally(function() {
          vm.loadingButtons = false;
          $scope.$applyAsync();
        });
    }
    loadDashboardButtons();
    // Save to Funifier
    function saveAllButtons() {
      vm.loadingButtons = true;
      // Only store custom buttons and visibility overrides for defaults
      var toStore = [];
      vm.dashboardButtons.forEach(function(btn) {
        if (btn.isDefault) {
          if (btn.visible === false) {
            toStore.push({ id: btn.id, route: btn.route, visible: false, isDefault: true });
          }
        } else {
          toStore.push(btn);
        }
      });
      $http.put(FUNIFIER_API, { value: toStore }, { headers: { Authorization: basicAuth } })
        .then(function() {
          alert('Botões salvos no Funifier!');
          loadDashboardButtons(); // Always fetch latest after save
        })
        .catch(function() {
          alert('Erro ao salvar botões no Funifier.');
          loadDashboardButtons(); // Also fetch on error to stay in sync
        })
        .finally(function() {
          vm.loadingButtons = false;
          $scope.$applyAsync();
        });
    }
    // Add custom button
    function addButtonFromFields() {
      if (!vm.newButtonLabel || !vm.newButtonIcon || !vm.newButtonRoute) return;
      var newBtn = {
        id: 'custom-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
        label: vm.newButtonLabel,
        icon: vm.newButtonIcon,
        route: vm.newButtonRoute,
        visible: true,
        isDefault: false
      };
      vm.dashboardButtons.push(newBtn);
      vm.newButtonLabel = '';
      vm.newButtonIcon = '';
      vm.newButtonRoute = '';
      saveAllButtons();
    }
    vm.addButtonFromFields = addButtonFromFields;
    // Delete custom button
    function deleteButton(btn) {
      if (btn.isDefault) return;
      vm.dashboardButtons = vm.dashboardButtons.filter(function(b) { return b.id !== btn.id; });
      saveAllButtons();
    }
    vm.deleteButton = deleteButton;
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
    // Load theme config from Funifier on controller init
    ThemeConfigService.getConfig().then(function(cfg) {
      vm.themeConfig = angular.copy(cfg);
      if (typeof vm.themeConfig.showStudioLogo === 'undefined') {
        vm.themeConfig.showStudioLogo = true;
      }
      vm.loadingTheme = false;
      $scope.$applyAsync();
    });
    // Reset dashboard buttons to default (remove all custom, activate all default)
    vm.resetDashboardButtonsToDefault = function() {
      if (!confirm('Tem certeza que deseja reverter os botões do dashboard para o padrão? Todos os botões personalizados serão removidos.')) return;
      vm.dashboardButtons = defaultDashboardButtons.map(function(def) {
        return Object.assign({}, def, { visible: true });
      });
      saveAllButtons();
    };
  }
})(); 