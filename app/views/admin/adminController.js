(function() {
  'use strict';
  angular.module('app').controller('AdminController', AdminController);
  AdminController.$inject = ['$scope', '$http', '$window', 'ThemeConfigService', 'SuccessMessageService'];
  function AdminController($scope, $http, $window, ThemeConfigService, SuccessMessageService) {
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
        .then(function(resp) { vm.stats.purchases = (resp.data || []).filter(function(log) { return log.actionId === 'comprar'; }).length; });
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
      // Cashback distributed/used/lost, points gained/used (placeholders, need real endpoints)
      // ...
    }
    // --- Challenges ---
    function saveChallenge(challenge) {
      var idx = vm.challenges.indexOf(challenge);
      if(idx === -1) vm.challenges.push(challenge);
      localStorage.setItem('admin_challenges', JSON.stringify(vm.challenges));
      alert(SuccessMessageService.get('challenge_saved'));
    }
    function addChallenge() {
      vm.challenges.push({ name: '', points: 0 });
    }
    // --- Action Log ---
    function createActionLog() {
      var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
      $http.post('https://service2.funifier.com/v3/activities', { action: vm.actionType, player: vm.actionPlayerId }, { headers: { Authorization: basicAuth } })
        .then(function() { alert(SuccessMessageService.get('log_created')); });
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
              vm.statModalLoading = false;
              $scope.$applyAsync();
            }
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
      } else if (vm.statModalKey === 'activePlayers') {
        // Build CSV from active players
        var rows = [];
        var headers = vm.statModalAttrKeys;
        rows.push(headers.join(','));
        vm.statModalData.forEach(function(player) {
          var row = headers.map(function(attr) {
            var val = player[attr];
            return '"' + (val !== null && val !== undefined ? val : '') + '"';
          });
          rows.push(row.join(','));
        });
        var csvContent = rows.join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'jogadores_ativos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  }
})(); 