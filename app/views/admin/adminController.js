(function() {
  'use strict';
  angular.module('app').controller('AdminController', AdminController);
  AdminController.$inject = ['$scope', '$http', '$window', 'ThemeConfigService', 'SuccessMessageService', 'AuthService', 'CashbackExpiryService', 'ActivityService'];
  function AdminController($scope, $http, $window, ThemeConfigService, SuccessMessageService, AuthService, CashbackExpiryService, ActivityService) {
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
    vm.stats = { purchases: null, activePlayers: null, cashbackDistributed: null, cashbackUsed: null, pointsGained: null, pointsUsed: null };
    vm.achievements = [];
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
      vm.error = '';
      if (!vm.user || !vm.pass) {
        vm.error = 'Por favor, preencha todos os campos.';
        return;
      }
      AuthService.login(vm.user, vm.pass)
        .then(function(player) {
          if (player && player.extra && player.extra.role === 'admin') {
            vm.loggedIn = true;
            vm.error = '';
          } else {
            vm.error = 'Acesso restrito: você não é um administrador.';
            AuthService.logout();
          }
          $scope.$applyAsync();
        })
        .catch(function(error) {
          vm.error = 'Usuário ou senha incorretos.';
          $scope.$applyAsync();
        });
    }
    // --- Theme Colors ---
    function saveColors() {
      vm.loadingTheme = true;
      ThemeConfigService.saveConfig(vm.themeConfig).then(function() {
        ThemeConfigService.applyConfig(vm.themeConfig);
        vm.loadingTheme = false;
        // Broadcast logo change so all views update
        $scope.$root.$broadcast('theme-logo-updated', vm.themeConfig.logo);
        alert(SuccessMessageService.get('colors_saved'));
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
        var reader = new FileReader();
        reader.onload = function(e) {
          vm.logoUrl = e.target.result;
          localStorage.setItem('admin_logoUrl', vm.logoUrl);
          $scope.$apply();
          alert(SuccessMessageService.get('logo_saved'));
        };
        reader.readAsDataURL(vm.logoFile);
      } else if(vm.logoUrl) {
        localStorage.setItem('admin_logoUrl', vm.logoUrl);
        alert(SuccessMessageService.get('logo_saved'));
      }
    }
    // --- Dashboard Buttons (Funifier sync) ---
    var FUNIFIER_COLLECTION = 'dashboard_buttons__c';
    var FUNIFIER_API = 'https://service2.funifier.com/v3/database/' + FUNIFIER_COLLECTION;
    var CONFIG_ID = 'dashboard_buttons';
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
      $http.get(FUNIFIER_API + "?strict=true&q=_id:'" + CONFIG_ID + "'", { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          var data = (resp.data && resp.data[0] && resp.data[0].value) ? resp.data[0].value : [];
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
      console.log('saveAllButtons called', vm.dashboardButtons);
      vm.loadingButtons = true;
      var toStore = [];
      vm.dashboardButtons.forEach(function(btn) {
        toStore.push(btn);
      });
      var payload = {
        _id: CONFIG_ID,
        value: toStore
      };
      console.log('About to PUT to Funifier:', payload);
      $http.put(FUNIFIER_API, payload, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          console.log('Funifier PUT success', resp);
          alert(SuccessMessageService.get('dashboard_buttons_saved'));
          loadDashboardButtons();
        })
        .catch(function(e) {
          console.error('Funifier PUT error', e);
          alert('Erro ao salvar botões no Funifier.');
          loadDashboardButtons();
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
      alert(SuccessMessageService.get('message_saved'));
    }
    // --- Stats (Funifier API, Basic Auth) ---
    function refreshStats() {
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      // Compras registradas: count action logs with actionId 'comprar'
      $http.get('https://service2.funifier.com/v3/action/log?actionId=comprar', { headers: { Authorization: 'Basic ' + basicAuth } })
        .then(function(resp) { vm.stats.purchases = (resp.data || []).filter(function(log) { return log.actionId === 'comprar'; }).length; $scope.$applyAsync && $scope.$applyAsync(); });
      // Active players: use /v3/player/status and 90-day rule
      $http.get('https://service2.funifier.com/v3/player/status', { headers: { Authorization: 'Basic ' + basicAuth } })
        .then(function(resp) {
          var players = resp.data || [];
          var now = Date.now();
          var ninetyDays = 90 * 24 * 60 * 60 * 1000;
          var activeCount = 0;
          var checked = 0;
          if (players.length === 0) {
            vm.stats.activePlayers = 0;
            $scope.$applyAsync && $scope.$applyAsync();
            return;
          }
          players.forEach(function(player) {
            var created = player.created || player.createdAt || player.creation || player.created_date;
            var createdTime = created ? new Date(created).getTime() : 0;
            if (now - createdTime < ninetyDays) {
              activeCount++;
              checked++;
              if (checked === players.length) {
                vm.stats.activePlayers = activeCount;
                $scope.$applyAsync && $scope.$applyAsync();
              }
            } else {
              // Check action logs for this player
              $http.get('https://service2.funifier.com/v3/action/log?playerId=' + encodeURIComponent(player.playerId || player._id), { headers: { Authorization: 'Basic ' + basicAuth } })
                .then(function(logResp) {
                  var logs = logResp.data || [];
                  var hasRecent = logs.some(function(log) {
                    return log.time && (now - new Date(log.time).getTime() < ninetyDays);
                  });
                  if (hasRecent) activeCount++;
                })
                .finally(function() {
                  checked++;
                  if (checked === players.length) {
                    vm.stats.activePlayers = activeCount;
                    $scope.$applyAsync && $scope.$applyAsync();
                  }
                });
            }
          });
        });
      // --- New: Achievements-based stats ---
      var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
      $http({
        method: 'GET',
        url: 'https://service2.funifier.com/v3/achievement',
        headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
      }).then(function(resp) {
        var achievements = resp.data || [];
        vm.achievements = achievements;
        // Cashback distribuído: sum of positive total for item 'cashback'
        vm.stats.cashbackDistributed = achievements.filter(function(a) { return a.type === 0 && a.item === 'cashback' && a.total > 0; }).reduce(function(sum, a) { return sum + a.total; }, 0);
        // Cashback usado: sum of negative total for item 'cashback', show as positive in stats
        var cashbackUsedSum = achievements.filter(function(a) { return a.type === 0 && a.item === 'cashback' && a.total < 0; }).reduce(function(sum, a) { return sum + a.total; }, 0);
        vm.stats.cashbackUsed = Math.abs(cashbackUsedSum);
        // Pontos ganhos: sum of positive total for item 'misscoins'
        vm.stats.pointsGained = achievements.filter(function(a) { return a.type === 0 && a.item === 'misscoins' && a.total > 0; }).reduce(function(sum, a) { return sum + a.total; }, 0);
        // Pontos usados: sum of negative total for item 'misscoins', show as positive in stats
        var pointsUsedSum = achievements.filter(function(a) { return a.type === 0 && a.item === 'misscoins' && a.total < 0; }).reduce(function(sum, a) { return sum + a.total; }, 0);
        vm.stats.pointsUsed = Math.abs(pointsUsedSum);
        $scope.$applyAsync && $scope.$applyAsync();
      });
    }
    // --- Challenges (Funifier API) ---
    var CHALLENGE_API = 'https://service2.funifier.com/v3/challenge';
    vm.challenges = [];
    vm.challengeModalOpen = false;
    vm.challengeModalData = null;
    vm.challengeModalIsNew = false;
    vm.loadingChallenges = false;
    vm.availableActions = [];
    vm.availablePointCategories = [];

    vm.loadChallenges = loadChallenges;
    vm.openChallengeModal = openChallengeModal;
    vm.closeChallengeModal = closeChallengeModal;
    vm.toggleActive = toggleActive;
    vm.restoreChallengesToDefault = restoreChallengesToDefault;

    function loadChallenges() {
      vm.loadingChallenges = true;
      $http.get(CHALLENGE_API, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          vm.challenges = resp.data || [];
        })
        .finally(function() {
          vm.loadingChallenges = false;
          $scope.$applyAsync && $scope.$applyAsync();
        });
    }
    loadChallenges();

    function fetchAvailableActionsAndPoints() {
      // Only fetch if not already loaded
      if (!vm.availableActions.length) {
        $http.get('https://service2.funifier.com/v3/action', { headers: { Authorization: basicAuth } })
          .then(function(resp) {
            vm.availableActions = resp.data || [];
            console.log('[Admin] Loaded actions:', vm.availableActions);
          });
      }
      if (!vm.availablePointCategories.length) {
        $http.get('https://service2.funifier.com/v3/point', { headers: { Authorization: basicAuth } })
          .then(function(resp) { vm.availablePointCategories = resp.data || []; });
      }
    }

    function openChallengeModal(challenge) {
      fetchAvailableActionsAndPoints();
      vm.challengeModalIsNew = !challenge;
      vm.challengeModalData = challenge ? angular.copy(challenge) : {
        challenge: '',
        description: '',
        active: true,
        rules: [{ actionId: '', operator: 1, total: 1 }],
        points: [{ total: 0, category: '', operation: 0 }],
        techniques: [],
        badge: null
      };
      vm.challengeModalOpen = true;
    }
    function closeChallengeModal() {
      vm.challengeModalOpen = false;
      vm.challengeModalData = null;
    }
    function saveChallenge() {
      var data = angular.copy(vm.challengeModalData);
      $http.post(CHALLENGE_API, data, { headers: { Authorization: basicAuth } })
        .then(function() {
          alert(SuccessMessageService.get('challenge_saved') || 'Desafio salvo!');
          vm.closeChallengeModal();
          vm.loadChallenges();
        });
    }
    function toggleActive(challenge) {
      var updated = angular.copy(challenge);
      updated.active = !updated.active;
      $http.post(CHALLENGE_API, updated, { headers: { Authorization: basicAuth } })
        .then(function() { vm.loadChallenges(); });
    }
    function restoreChallengesToDefault() {
      if (!confirm('Tem certeza que deseja restaurar os desafios para o padrão? Todos os desafios atuais serão desativados, exceto os padrões.')) return;
      var defaults = [
        {
          challenge: 'Venda 10 salsichas',
          description: 'Venda 10 salsichas para ganhar 25 pontos MissCoins',
          active: true,
          rules: [{ actionId: 'comprar', operator: 1, total: 10 }],
          points: [{ total: 25, category: 'misscoins', operation: 0 }],
          techniques: ['GT35'],
          badge: null
        }
        // Adicione outros desafios padrão aqui
      ];
      $http.get(CHALLENGE_API, { headers: { Authorization: basicAuth } }).then(function(resp) {
        var current = resp.data || [];
        var defaultNames = defaults.map(function(d) { return d.challenge; });
        var reqs = [];
        current.forEach(function(ch) {
          if (!defaultNames.includes(ch.challenge) && ch.active) {
            var updated = angular.copy(ch);
            updated.active = false;
            reqs.push($http.post(CHALLENGE_API, updated, { headers: { Authorization: basicAuth } }));
          }
        });
        defaults.forEach(function(def) {
          var found = current.find(function(ch) { return ch.challenge === def.challenge; });
          if (found) {
            var updated = Object.assign({}, found, def, { active: true });
            reqs.push($http.post(CHALLENGE_API, updated, { headers: { Authorization: basicAuth } }));
          } else {
            reqs.push($http.post(CHALLENGE_API, def, { headers: { Authorization: basicAuth } }));
          }
        });
        Promise.all(reqs).then(function() {
          alert('Desafios restaurados para o padrão!');
          vm.loadChallenges();
        });
      });
    }
    // --- Action Log (Enhanced) ---
    vm.availablePlayers = [];
    vm.selectedPlayerObj = null;
    vm.selectedActionObj = null;
    vm.actionAttributes = {};
    vm.actionAttributeDefs = [];
    // Fetch all players on admin load
    function fetchAllPlayers() {
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      $http.get('https://service2.funifier.com/v3/player/status', { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          vm.availablePlayers = resp.data || [];
          console.log('[Admin] Loaded players:', vm.availablePlayers);
          $scope.$applyAsync && $scope.$applyAsync();
        });
    }
    fetchAllPlayers();
    fetchAvailableActionsAndPoints();
    // When an action is selected, update attribute fields
    vm.onActionSelected = function(actionObj) {
      if (!actionObj) {
        vm.actionAttributeDefs = [];
        vm.actionAttributes = {};
        return;
      }
      if (actionObj && Array.isArray(actionObj.attributes)) {
        vm.actionAttributeDefs = actionObj.attributes;
        var attrs = {};
        actionObj.attributes.forEach(function(attr) { attrs[attr.name] = ''; });
        vm.actionAttributes = attrs;
      } else {
        vm.actionAttributeDefs = [];
        vm.actionAttributes = {};
      }
    };
    // Enhanced createActionLog
    vm.createActionLog = function() {
      if (!vm.selectedPlayerObj || !vm.selectedActionObj) {
        console.warn('[Admin] createActionLog: Missing player or action', vm.selectedPlayerObj, vm.selectedActionObj);
        return;
      }
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      var payload = {
        actionId: vm.selectedActionObj._id,
        userId: vm.selectedPlayerObj._id,
        attributes: angular.copy(vm.actionAttributes)
      };
      console.log('[Admin] Creating action log, payload:', payload);
      $http.post('https://service2.funifier.com/v3/action/log', payload, { headers: { Authorization: basicAuth } })
        .then(function(response) {
          console.log('[Admin] Action log created, response:', response);
          alert(SuccessMessageService.get('log_created'));
        })
        .catch(function(error) {
          console.error('[Admin] Failed to create action log:', error);
          alert('Erro ao criar log de ação. Veja o console para detalhes.');
        });
    };
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
      var payload = {
        _id: CONFIG_ID,
        value: vm.dashboardButtons
      };
      $http.put(FUNIFIER_API, payload, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          alert(SuccessMessageService.get('dashboard_buttons_reset'));
          loadDashboardButtons();
        })
        .catch(function(e) {
          alert('Erro ao restaurar botões do dashboard.');
          loadDashboardButtons();
        })
        .finally(function() {
          vm.loadingButtons = false;
          $scope.$applyAsync();
        });
    };
    vm.successMessages = {};
    vm.editingSuccessMessages = {};
    vm.loadSuccessMessages = function() {
      SuccessMessageService.fetchAll().then(function(messages) {
        vm.successMessages = angular.copy(messages);
        vm.editingSuccessMessages = angular.copy(messages);
        $scope.$applyAsync && $scope.$applyAsync();
      });
    };
    vm.saveAllSuccessMessages = function() {
      var apiUrl = 'https://service2.funifier.com/v3/database/success_messages__c/bulk';
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      var payload = Object.keys(vm.editingSuccessMessages).map(function(key) {
        return { _id: key, message: vm.editingSuccessMessages[key] };
      });
      $http.post(apiUrl, payload, { headers: { Authorization: basicAuth } })
        .then(function() {
          vm.successMessages = angular.copy(vm.editingSuccessMessages);
          alert(SuccessMessageService.get('message_saved') || 'Mensagens salvas!');
        });
    };
    vm.restoreSuccessMessagesToDefault = function() {
      if (!confirm('Tem certeza que deseja restaurar todas as mensagens de sucesso para o padrão?')) return;
      // Default messages (should match the initial Funifier setup)
      var defaults = {
        login_success: 'Login diário realizado com sucesso!',
        purchase_success: 'Compra registrada com sucesso!',
        exchange_success: 'Troca realizada com sucesso!',
        register_success: 'Cadastro realizado com sucesso! Faça login para continuar.',
        logo_saved: 'Logo salva!',
        message_saved: 'Mensagem salva!',
        challenge_saved: 'Desafio salvo!',
        dashboard_buttons_saved: 'Botões salvos no Funifier!',
        dashboard_buttons_reset: 'Botões do dashboard restaurados para o padrão!',
        redemption_success: 'Resgate realizado com sucesso!',
        points_cashback_updated: 'Pontos e cashback atualizados!',
        profile_updated: 'Perfil atualizado com sucesso!',
        quiz_success: 'Quiz respondido com sucesso!',
        log_created: 'Log criado!'
      };
      vm.editingSuccessMessages = angular.copy(defaults);
      vm.saveAllSuccessMessages();
    };
    // Load on init
    vm.loadSuccessMessages();
    // --- Statistics Modal Logic ---
    vm.statModalOpen = false;
    vm.statModalKey = null;
    vm.statModalTitle = '';
    vm.statModalData = [];
    vm.statModalLoading = false;
    vm.openStatModal = function(statKey) {
      vm.statModalKey = statKey;
      vm.statModalOpen = true;
      vm.statModalLoading = true;
      if (statKey === 'purchases') {
        vm.statModalTitle = 'Compras registradas';
        $http.get('https://service2.funifier.com/v3/action/log?actionId=comprar', { headers: { Authorization: 'Basic ' + basicAuth } })
          .then(function(resp) {
            // Filter logs to only those with actionId 'comprar'
            var logs = (resp.data || []).filter(function(log) { return log.actionId === 'comprar'; });
            vm.statModalData = logs;
            // Collect all unique attribute keys for table columns
            var attrKeys = new Set();
            logs.forEach(function(log) {
              if (log.attributes) {
                Object.keys(log.attributes).forEach(function(k) { attrKeys.add(k); });
              }
            });
            vm.statModalAttrKeys = Array.from(attrKeys);
            // Update stats to match modal
            vm.stats.purchases = logs.length;
          })
          .finally(function() {
            vm.statModalLoading = false;
            $scope.$applyAsync();
          });
      } else if (statKey === 'activePlayers') {
        vm.statModalTitle = 'Jogadores ativos';
        $http.get('https://service2.funifier.com/v3/player/status', { headers: { Authorization: 'Basic ' + basicAuth } })
          .then(function(resp) {
            var players = resp.data || [];
            var now = Date.now();
            var ninetyDays = 90 * 24 * 60 * 60 * 1000;
            var activePlayers = [];
            var checked = 0;
            if (players.length === 0) {
              vm.statModalData = [];
              vm.statModalAttrKeys = [];
              vm.stats.activePlayers = 0;
              vm.statModalLoading = false;
              $scope.$applyAsync();
              return;
            }
            players.forEach(function(player) {
              var created = player.created || player.createdAt || player.creation || player.created_date;
              var createdTime = created ? new Date(created).getTime() : 0;
              if (now - createdTime < ninetyDays) {
                activePlayers.push(player);
                checked++;
                if (checked === players.length) {
                  finishActivePlayers();
                }
              } else {
                $http.get('https://service2.funifier.com/v3/action/log?playerId=' + encodeURIComponent(player.playerId || player._id), { headers: { Authorization: 'Basic ' + basicAuth } })
                  .then(function(logResp) {
                    var logs = logResp.data || [];
                    var hasRecent = logs.some(function(log) {
                      return log.time && (now - new Date(log.time).getTime() < ninetyDays);
                    });
                    if (hasRecent) activePlayers.push(player);
                  })
                  .finally(function() {
                    checked++;
                    if (checked === players.length) {
                      finishActivePlayers();
                    }
                  });
              }
            });
            function finishActivePlayers() {
              vm.statModalData = activePlayers;
              // Collect all unique keys for table columns (excluding system fields)
              var attrKeys = new Set();
              activePlayers.forEach(function(player) {
                Object.keys(player).forEach(function(k) {
                  if (!["_id","__v","password","salt"].includes(k)) attrKeys.add(k);
                });
              });
              vm.statModalAttrKeys = Array.from(attrKeys);
              // Update stats to match modal
              vm.stats.activePlayers = activePlayers.length;
              vm.statModalLoading = false;
              $scope.$applyAsync();
            }
          });
      } else if (statKey === 'cashbackDistributed') {
        vm.statModalTitle = 'Cashback distribuído';
        var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
        $http({
          method: 'GET',
          url: 'https://service2.funifier.com/v3/achievement',
          headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
        }).then(function(resp) {
          var achievements = (resp.data || []).filter(function(a) { return a.type === 0 && a.item === 'cashback' && a.total > 0; });
          vm.statModalData = achievements;
          vm.statModalAttrKeys = ['player', 'total', 'time'];
          vm.stats.cashbackDistributed = achievements.reduce(function(sum, a) { return sum + a.total; }, 0);
          vm.statModalLoading = false;
          $scope.$applyAsync();
        });
      } else if (statKey === 'cashbackLost') {
        vm.statModalTitle = 'Cashback perdido';
        var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
        $http({
          method: 'GET',
          url: 'https://service2.funifier.com/v3/achievement',
          headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
        }).then(function(resp) {
          var achievements = (resp.data || []).filter(function(a) { return a.type === 0 && a.item === 'cashback' && a.total < 0; });
          vm.statModalData = achievements;
          vm.statModalAttrKeys = ['player', 'total', 'time'];
          vm.stats.cashbackLost = achievements.reduce(function(sum, a) { return sum + a.total; }, 0);
          vm.statModalLoading = false;
          $scope.$applyAsync();
        });
      } else if (statKey === 'pointsGained') {
        vm.statModalTitle = 'Pontos ganhos';
        var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
        $http({
          method: 'GET',
          url: 'https://service2.funifier.com/v3/achievement',
          headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
        }).then(function(resp) {
          var achievements = (resp.data || []).filter(function(a) { return a.type === 0 && a.item === 'misscoins' && a.total > 0; });
          vm.statModalData = achievements;
          vm.statModalAttrKeys = ['player', 'total', 'time'];
          vm.stats.pointsGained = achievements.reduce(function(sum, a) { return sum + a.total; }, 0);
          vm.statModalLoading = false;
          $scope.$applyAsync();
        });
      } else if (statKey === 'pointsUsed') {
        vm.statModalTitle = 'Pontos usados';
        var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
        $http({
          method: 'GET',
          url: 'https://service2.funifier.com/v3/achievement',
          headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
        }).then(function(resp) {
          var achievements = (resp.data || []).filter(function(a) { return a.type === 0 && a.item === 'misscoins' && a.total < 0; });
          vm.statModalData = achievements;
          vm.statModalAttrKeys = ['player', 'total', 'time'];
          vm.stats.pointsUsed = Math.abs(achievements.reduce(function(sum, a) { return sum + a.total; }, 0));
          vm.statModalLoading = false;
          $scope.$applyAsync();
        });
      } else if (statKey === 'cashbackUsed') {
        vm.statModalTitle = 'Cashback usado';
        var bearerToken = 'Bearer eyJhbGciOiJIUzUxMiIsImNhbGciOiJHWklQIn0.H4sIAAAAAAAAAE2MwQrCMBAFf0X23EOymybBs5569yrb7BYqpS1Ni4r470YK4m14zJsX8Nw3-oQj-Ig1MlokDF1wHTGJNUaggpymWYuyKMuVh6E63Jd-1R1FB_0xr9xy1vLhlKZtXPewk1rbv3ASbL_SlnUpxvkynoK_laHn8rDBRUMmkqtAH_M-eKo9ufcH5U20dbEAAAA.2VIg4wWv9vx_9laMfAhSd9Nea8N0yMew_c2ng-AQOCv7N_ELrN_SIswFz9mB4dEk-PyMOTx5uzJb48zcPONbwA';
        $http({
          method: 'GET',
          url: 'https://service2.funifier.com/v3/achievement',
          headers: { 'Authorization': bearerToken, 'Content-Type': 'application/json' }
        }).then(function(resp) {
          var achievements = (resp.data || []).filter(function(a) { return a.type === 0 && a.item === 'cashback' && a.total < 0; });
          vm.statModalData = achievements;
          vm.statModalAttrKeys = ['player', 'total', 'time'];
          vm.stats.cashbackUsed = Math.abs(achievements.reduce(function(sum, a) { return sum + a.total; }, 0));
          vm.statModalLoading = false;
          $scope.$applyAsync();
        });
      }
    };
    vm.closeStatModal = function() {
      vm.statModalOpen = false;
      vm.statModalKey = null;
      vm.statModalData = [];
    };
    vm.exportStatCsv = function() {
      if (vm.statModalKey === 'purchases') {
        // Build CSV from modal data
        var rows = [];
        var headers = ['Jogador', 'Data'].concat(vm.statModalAttrKeys);
        rows.push(headers.join(','));
        vm.statModalData.forEach(function(log) {
          var row = [
            '"' + (log.userId || '') + '"',
            '"' + (log.time ? (new Date(log.time)).toLocaleString('pt-BR') : '') + '"'
          ];
          vm.statModalAttrKeys.forEach(function(attr) {
            var val = (log.attributes && log.attributes[attr] !== undefined) ? log.attributes[attr] : '';
            row.push('"' + (val !== null ? val : '') + '"');
          });
          rows.push(row.join(','));
        });
        var csvContent = rows.join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'compras_registradas.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (
        vm.statModalKey === 'cashbackDistributed' ||
        vm.statModalKey === 'cashbackLost' ||
        vm.statModalKey === 'pointsGained' ||
        vm.statModalKey === 'pointsUsed' ||
        vm.statModalKey === 'cashbackUsed'
      ) {
        // Build CSV from achievement data
        var rows = [];
        var headers = vm.statModalAttrKeys;
        rows.push(headers.join(','));
        vm.statModalData.forEach(function(row) {
          var csvRow = headers.map(function(attr) {
            var val = row[attr];
            if (attr === 'time' && val) {
              return '"' + (new Date(val)).toLocaleString('pt-BR') + '"';
            }
            return '"' + (val !== null && val !== undefined ? val : '') + '"';
          });
          rows.push(csvRow.join(','));
        });
        var csvContent = rows.join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', vm.statModalTitle.replace(/ /g, '_').toLowerCase() + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    // Logo file change handler for logo upload
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
    // --- Actions Management ---
    var ACTION_API = 'https://service2.funifier.com/v3/action';
    vm.actions = [];
    vm.loadingActions = false;
    vm.editingAction = null; // {action, attributes, active, _id}
    vm.isEditingExistingAction = false;
    vm.newAttribute = { name: '', type: 'String' };
    vm.actionTypes = ['String', 'Number'];

    vm.loadActions = function() {
      vm.loadingActions = true;
      $http.get(ACTION_API, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          vm.actions = resp.data || [];
          $scope.$applyAsync && $scope.$applyAsync();
        })
        .finally(function() { vm.loadingActions = false; });
    };
    vm.loadActions();

    vm.startAddAction = function() {
      vm.editingAction = { action: '', attributes: [], active: true, _id: '' };
      vm.isEditingExistingAction = false;
      vm.newAttribute = { name: '', type: 'String' };
    };
    vm.startEditAction = function(action) {
      vm.editingAction = angular.copy(action);
      vm.isEditingExistingAction = true;
      vm.newAttribute = { name: '', type: 'String' };
    };
    vm.cancelEditAction = function() {
      vm.editingAction = null;
      vm.isEditingExistingAction = false;
    };
    vm.addAttributeToAction = function() {
      if (!vm.newAttribute.name || !vm.newAttribute.type) return;
      vm.editingAction.attributes = vm.editingAction.attributes || [];
      vm.editingAction.attributes.push(angular.copy(vm.newAttribute));
      vm.newAttribute = { name: '', type: 'String' };
    };
    vm.removeAttributeFromAction = function(idx) {
      if (vm.editingAction && vm.editingAction.attributes) {
        vm.editingAction.attributes.splice(idx, 1);
      }
    };
    vm.saveAction = function() {
      if (!vm.editingAction.action || !vm.editingAction._id) return;
      var payload = angular.copy(vm.editingAction);
      $http.post(ACTION_API, payload, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          alert(vm.isEditingExistingAction ? 'Ação atualizada!' : 'Ação criada!');
          vm.loadActions();
          vm.cancelEditAction();
        })
        .catch(function(err) {
          alert('Erro ao salvar ação. Veja o console.');
          console.error('[Admin] Erro ao salvar ação:', err);
        });
    };
    vm.toggleActionActive = function(action) {
      var updated = angular.copy(action);
      updated.active = !updated.active;
      $http.post(ACTION_API, updated, { headers: { Authorization: basicAuth } })
        .then(function() { vm.loadActions(); })
        .catch(function(err) { alert('Erro ao ativar/desativar ação.'); });
    };
    vm.deleteAction = function(action) {
      if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
      $http.delete(ACTION_API + '/' + encodeURIComponent(action._id), { headers: { Authorization: basicAuth } })
        .then(function() { vm.loadActions(); })
        .catch(function(err) { alert('Erro ao excluir ação.'); });
    };
    vm.restoreActionsToDefault = function() {
      if (!confirm('Tem certeza que deseja restaurar as ações para o padrão? Isso irá sobrescrever todas as ações atuais.')) return;
      vm.loadingActions = true;
      // Updated default actions to match current database state
      var defaultActions = [
        {
          "action": "Compartilhar",
          "attributes": [],
          "points": [],
          "notifications": [],
          "active": true,
          "extra": {},
          "_id": "compartilhar"
        },
        {
          "action": "Comprar",
          "attributes": [
            { "name": "produto", "type": "String" },
            { "name": "valor", "type": "Number" }
          ],
          "points": [],
          "notifications": [],
          "image": {
            "small": { "url": "https://img.icons8.com/?size=100&id=bkfXMM2Up4Aw&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 },
            "medium": { "url": "https://img.icons8.com/?size=100&id=bkfXMM2Up4Aw&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 },
            "original": { "url": "https://img.icons8.com/?size=100&id=bkfXMM2Up4Aw&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 }
          },
          "active": true,
          "extra": {},
          "_id": "comprar"
        },
        {
          "action": "Convidar",
          "attributes": [],
          "points": [],
          "notifications": [],
          "active": true,
          "extra": {},
          "_id": "convidar"
        },
        {
          "action": "Logar",
          "attributes": [],
          "points": [],
          "notifications": [],
          "image": {
            "small": { "url": "https://img.icons8.com/?size=100&id=AESKWmYDw4t6&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 },
            "medium": { "url": "https://img.icons8.com/?size=100&id=AESKWmYDw4t6&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 },
            "original": { "url": "https://img.icons8.com/?size=100&id=AESKWmYDw4t6&format=png&color=000000", "size": 0, "width": 0, "height": 0, "depth": 0 }
          },
          "active": true,
          "extra": {},
          "_id": "logar"
        },
        {
          "action": "Registrar",
          "attributes": [],
          "points": [],
          "notifications": [],
          "active": true,
          "extra": {},
          "_id": "registrar"
        },
        {
          "action": "Responder",
          "attributes": [ { "name": "", "type": "" } ],
          "points": [ { "total": 10, "category": "misscoins", "operation": 0, "perPlayer": false } ],
          "notifications": [],
          "active": true,
          "extra": {},
          "_id": "responder"
        }
      ];
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      var ACTION_API = 'https://service2.funifier.com/v3/action';
      // Delete all current actions, then POST defaults
      $http.get(ACTION_API, { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          var actions = resp.data || [];
          var deletePromises = actions.map(function(a) {
            return $http.delete(ACTION_API + '/' + a._id, { headers: { Authorization: basicAuth } });
          });
          Promise.all(deletePromises).then(function() {
            var createPromises = defaultActions.map(function(a) {
              return $http.post(ACTION_API, a, { headers: { Authorization: basicAuth } });
            });
            Promise.all(createPromises).then(function() {
              vm.loadActions();
              vm.loadingActions = false;
            });
          });
        });
    };
    vm.scrollToSection = function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    vm.saveAllSections = function() {
      // Save theme/colors
      vm.saveColors && vm.saveColors();
      // Save logo (if needed)
      vm.saveLogo && vm.saveLogo();
      // Save dashboard buttons
      vm.saveAllButtons && vm.saveAllButtons();
      // Save success messages
      vm.saveAllSuccessMessages && vm.saveAllSuccessMessages();
      // Save challenge if modal is open (editing)
      if (vm.challengeModalOpen && vm.challengeModalData) {
        vm.saveChallenge && vm.saveChallenge();
      }
      alert('Todas as seções foram salvas!');
    };
    // Cashback Expiry Admin Section (Funifier)
    var CASHBACK_EXPIRY_API = 'https://service2.funifier.com/v3/database/cashback_expiry_config__c';
    var CASHBACK_EXPIRY_ID = 'cashback_expiry_days';
    vm.cashbackExpiryDays = 90;
    // Fetch from Funifier on init
    $http.get(CASHBACK_EXPIRY_API + "?q=_id:'" + CASHBACK_EXPIRY_ID + "'", { headers: { Authorization: basicAuth } })
      .then(function(resp) {
        if (resp.data && resp.data[0] && resp.data[0].days) {
          vm.cashbackExpiryDays = resp.data[0].days;
        }
      });
    vm.saveCashbackExpiryDays = function() {
      if (vm.cashbackExpiryDays < 1 || vm.cashbackExpiryDays > 365) {
        alert('O valor deve ser entre 1 e 365 dias.');
        return;
      }
      var payload = { _id: CASHBACK_EXPIRY_ID, days: vm.cashbackExpiryDays };
      $http.put(CASHBACK_EXPIRY_API, payload, { headers: { Authorization: basicAuth } })
        .then(function() {
          alert('Dias de expiração do cashback salvos!');
        });
    };
    vm.restoreCashbackExpiryDefault = function() {
      vm.cashbackExpiryDays = 90;
      vm.saveCashbackExpiryDays();
    };
    // Bulk Expiry for All Players (single aggregate approach)
    vm.bulkExpiryLoading = false;
    vm.bulkExpireCashbackForAllPlayers = function() {
      if (!confirm('Tem certeza que deseja rodar a expiração de cashback para TODOS os jogadores?')) return;
      vm.bulkExpiryLoading = true;
      // Expert choice: single aggregate for all cashback achievements
      $http.post('https://service2.funifier.com/v3/database/achievement/aggregate?strict=true', [
        { "$match": { item: "cashback" } }
      ], { headers: { Authorization: basicAuth, 'Content-Type': 'application/json' } })
        .then(function(resp) {
          var achievements = resp.data || [];
          // Group by player
          var byPlayer = {};
          achievements.forEach(function(a) {
            var pid = a.player;
            if (!byPlayer[pid]) byPlayer[pid] = [];
            byPlayer[pid].push(a);
          });
          var playerIds = Object.keys(byPlayer);
          var now = Date.now();
          var errors = [];
          var done = 0;
          // Fetch expiry days from Funifier
          $http.get('https://service2.funifier.com/v3/database/cashback_expiry_config__c?q=_id:\'cashback_expiry_days\'', { headers: { Authorization: basicAuth } })
            .then(function(cfgResp) {
              var days = 90;
              if (cfgResp.data && cfgResp.data[0] && cfgResp.data[0].days) {
                days = cfgResp.data[0].days;
              }
              var expiryMs = days * 24 * 60 * 60 * 1000;
              var fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
              // For each player, process expiry
              playerIds.forEach(function(pid) {
                var playerAchievements = byPlayer[pid];
                var expired = playerAchievements.filter(function(a) {
                  var timeMs = (typeof a.time === 'object' && a.time.$date)
                    ? new Date(a.time.$date).getTime()
                    : a.time;
                  return now - timeMs > expiryMs;
                });
                var expiringSoon = playerAchievements.filter(function(a) {
                  var timeMs = (typeof a.time === 'object' && a.time.$date)
                    ? new Date(a.time.$date).getTime()
                    : a.time;
                  return now - timeMs > (expiryMs - fiveDaysMs) && now - timeMs < expiryMs;
                });
                // Send SMS for expiring soon
                if (expiringSoon.length) {
                  $http.get('https://service2.funifier.com/v3/player/' + encodeURIComponent(pid), { headers: { Authorization: basicAuth } }).then(function(resp) {
                    var player = resp.data;
                    var phone = player.extra && player.extra.phone;
                    if (phone) {
                      phone = phone.replace(/\D/g, '');
                      if (!phone.startsWith('55')) phone = '55' + phone;
                      phone = '+' + phone;
                      expiringSoon.forEach(function() {
                        // Use ActivityService if available
                        if (typeof ActivityService !== 'undefined' && ActivityService.sendSmsNotification) {
                          ActivityService.sendSmsNotification(phone, 'Seus pontos/cashback vão expirar em 5 dias!');
                        }
                      });
                    }
                  });
                }
                // Expire old cashback
                var actions = expired.map(function(a) {
                  // a) Log 'expired_cashback' achievement (Basic Auth)
                  var logExpired = $http.post('https://service2.funifier.com/v3/database/achievement', {
                    player: pid,
                    item: 'expired_cashback',
                    time: now,
                    type: 0,
                    total: a.total,
                    extra: { original_achievement_id: a._id }
                  }, {
                    headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
                  });
                  // b) Delete the old cashback achievement (Basic Auth)
                  var deleteOld = $http.delete('https://service2.funifier.com/v3/database/achievement?q=' + encodeURIComponent("_id:'" + a._id + "'"), {
                    headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
                  });
                  return Promise.all([logExpired, deleteOld]);
                });
                Promise.all(actions).catch(function(e) { errors.push(pid); }).finally(function() {
                  done++;
                  if (done === playerIds.length) {
                    vm.bulkExpiryLoading = false;
                    if (errors.length) {
                      alert('Expiração concluída com erros para alguns jogadores. Veja o console.');
                      console.error('Erros de expiração para jogadores:', errors);
                    } else {
                      alert('Expiração em massa concluída para todos os jogadores!');
                    }
                    $scope.$applyAsync && $scope.$applyAsync();
                  }
                });
              });
            });
        });
      // NOTE: For very large user bases, switch to batching or per-player queries to avoid memory/timeouts.
    };
    // Google Calendar Config Admin Section (Funifier)
    var CALENDAR_CONFIG_API = 'https://service2.funifier.com/v3/database/calendar_config__c';
    var CALENDAR_CONFIG_ID = 'google_calendar_config';
    var CALENDAR_CONFIG_DEFAULTS_ID = 'google_calendar_config_defaults';
    vm.googleApiKey = '';
    vm.googleCalendarId = '';
    // Fetch from Funifier on init
    $http.get(CALENDAR_CONFIG_API + "?q=_id:'" + CALENDAR_CONFIG_ID + "'", { headers: { Authorization: basicAuth } })
      .then(function(resp) {
        if (resp.data && resp.data[0]) {
          vm.googleApiKey = resp.data[0].apiKey || '';
          vm.googleCalendarId = resp.data[0].calendarId || '';
        }
      });
    vm.saveCalendarConfig = function() {
      var payload = { _id: CALENDAR_CONFIG_ID, apiKey: vm.googleApiKey, calendarId: vm.googleCalendarId };
      $http.put(CALENDAR_CONFIG_API, payload, { headers: { Authorization: basicAuth } })
        .then(function() {
          alert('Configuração do Google Agenda salva!');
        });
    };
    vm.restoreCalendarConfigDefault = function() {
      // Fetch defaults from Funifier
      $http.get(CALENDAR_CONFIG_API + "?q=_id:'" + CALENDAR_CONFIG_DEFAULTS_ID + "'", { headers: { Authorization: basicAuth } })
        .then(function(resp) {
          if (resp.data && resp.data[0]) {
            vm.googleApiKey = resp.data[0].apiKey || '';
            vm.googleCalendarId = resp.data[0].calendarId || '';
          } else {
            vm.googleApiKey = '';
            vm.googleCalendarId = '';
          }
          vm.saveCalendarConfig();
        });
    };
    vm.restoreAllDefaults = function() {
      if (!confirm('Tem certeza que deseja restaurar TODOS os valores para o padrão? Esta ação não pode ser desfeita.')) return;
      vm.resetToDefault && vm.resetToDefault();
      vm.resetDashboardButtonsToDefault && vm.resetDashboardButtonsToDefault();
      vm.restoreSuccessMessagesToDefault && vm.restoreSuccessMessagesToDefault();
      vm.restoreChallengesToDefault && vm.restoreChallengesToDefault();
      vm.restoreCashbackExpiryDefault && vm.restoreCashbackExpiryDefault();
      vm.restoreActionsToDefault && vm.restoreActionsToDefault();
      vm.restoreCalendarConfigDefault && vm.restoreCalendarConfigDefault();
      alert('Todos os valores foram restaurados para o padrão!');
    };
    // --- SMS Notification ---
    vm.smsPhone = '';
    vm.smsMessage = '';
    vm.smsSending = false;
    vm.sendSmsNotification = function() {
      if (!vm.smsPhone || !vm.smsMessage) {
        alert('Preencha o telefone e a mensagem.');
        return;
      }
      vm.smsSending = true;
      ActivityService.sendSmsNotification(vm.smsPhone, vm.smsMessage)
        .then(function() {
          alert('SMS enviado com sucesso!');
        })
        .catch(function(err) {
          alert('Erro ao enviar SMS: ' + (err && err.data && err.data.error ? err.data.error : err));
        })
        .finally(function() {
          vm.smsSending = false;
          $scope.$applyAsync && $scope.$applyAsync();
        });
    };
  }
})();

// --- Admin Register Controller ---
angular.module('app').controller('AdminRegisterController', function($scope, $http, FUNIFIER_API_CONFIG) {
    var regVm = this;
    regVm.loading = false;
    regVm.error = null;
    regVm.success = null;
    regVm.user = {
        name: '',
        email: '',
        phone: '',
        birthdate: '',
        cpf: '',
        password: '',
        confirmPassword: '',
        referralCode: ''
    };
    regVm.register = function() {
        regVm.error = null;
        regVm.success = null;
        if (regVm.user.password !== regVm.user.confirmPassword) {
            regVm.error = 'As senhas não coincidem.';
            return;
        }
        regVm.loading = true;
        // Step 1: Fetch all players to ensure unique mycode
        $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/player',
            headers: {
                'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                'Content-Type': 'application/json'
            }
        }).then(function(allPlayersRes) {
            var allPlayers = allPlayersRes.data || [];
            function randomCode(length) {
                var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                var code = '';
                for (var i = 0; i < length; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            }
            var existingCodes = new Set();
            allPlayers.forEach(function(p) {
                if (p.extra && p.extra.mycode) existingCodes.add(p.extra.mycode);
            });
            var mycode;
            do {
                mycode = randomCode(7);
            } while (existingCodes.has(mycode));
            var playerData = {
                _id: regVm.user.email.toLowerCase().trim(),
                name: regVm.user.name,
                email: regVm.user.email.toLowerCase().trim(),
                password: regVm.user.password,
                image: {
                    small: { url: "https://my.funifier.com/images/funny.png" },
                    medium: { url: "https://my.funifier.com/images/funny.png" },
                    original: { url: "https://my.funifier.com/images/funny.png" }
                },
                teams: [],
                friends: [],
                extra: {
                    country: "Brasil",
                    phone: regVm.user.phone,
                    cpf: regVm.user.cpf,
                    birthdate: regVm.user.birthdate,
                    cep: "",
                    referredBy: regVm.user.referralCode || null,
                    mycode: mycode,
                    termsAccepted: true,
                    termsAcceptedDate: new Date().toISOString(),
                    register: true
                }
            };
            // Step 2: Register the player
            $http({
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/player',
                headers: {
                    'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                    'Content-Type': 'application/json'
                },
                data: playerData
            }).then(function(response) {
                // Step 3: Assign the 'Player' role
                $http({
                    method: 'PUT',
                    url: FUNIFIER_API_CONFIG.baseUrl + '/database/principal',
                    headers: {
                        'Authorization': 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==',
                        'Content-Type': 'application/json'
                    },
                    data: {
                        _id: playerData._id,
                        valueId: playerData._id,
                        roles: ['Player'],
                        name: playerData.name,
                        team: false,
                        type: 0,
                        userId: playerData._id,
                        player: true
                    }
                }).then(function(response) {
                    regVm.success = 'Jogador registrado com sucesso!';
                    regVm.user = {
                        name: '',
                        email: '',
                        phone: '',
                        birthdate: '',
                        cpf: '',
                        password: '',
                        confirmPassword: '',
                        referralCode: ''
                    };
                    $scope.adminRegisterForm.$setPristine();
                    $scope.adminRegisterForm.$setUntouched();
                }).catch(function(error) {
                    regVm.error = 'Erro ao atribuir papel ao jogador.';
                });
            }).catch(function(error) {
                regVm.error = error.data && error.data.message ? error.data.message : 'Erro ao registrar jogador.';
            }).finally(function() {
                regVm.loading = false;
            });
        }).catch(function(error) {
            regVm.error = 'Erro ao buscar jogadores para gerar código único.';
            regVm.loading = false;
        });
    };
}); 