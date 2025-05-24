(function() {
    'use strict';

    angular
        .module('app')
        .controller('CashbackCouponController', CashbackCouponController);

    CashbackCouponController.$inject = ['$scope', '$http', 'PlayerService', 'FUNIFIER_API_CONFIG', '$timeout', 'SuccessMessageService'];

    function CashbackCouponController($scope, $http, PlayerService, FUNIFIER_API_CONFIG, $timeout, SuccessMessageService) {
        var vm = this;
        vm.cashbackBalance = 0;
        vm.amountToConvert = null;
        vm.loading = false;
        vm.error = null;
        vm.success = null;
        vm.coupons = [];

        var CASHBACK_ITEM_ID = 'EXjJnR2'; // The special cashback virtual good
        var CATALOG_ID = 'cashback';
        var COUPON_COLLECTION = 'cashback_coupons__c';
        var COUPON_API = FUNIFIER_API_CONFIG.baseUrl + '/database/' + COUPON_COLLECTION;
        var PURCHASE_API = FUNIFIER_API_CONFIG.baseUrl + '/virtualgoods/purchase';
        var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';

        activate();

        function activate() {
            loadCashbackBalance();
            loadCoupons();
        }

        function loadCashbackBalance() {
            PlayerService.getStatus().then(function(response) {
                var player = response.data;
                vm.playerStatus = player;
                // Cashback is stored as integer points; display as reais
                var points = (player.pointCategories && player.pointCategories.cashback) ||
                             (player.point_categories && player.point_categories.cashback) ||
                             0;
                vm.cashbackPoints = points;
                vm.cashbackBalance = points * 0.05;
                $scope.$applyAsync && $scope.$applyAsync();
            });
        }

        function loadCoupons() {
            // Only show coupons for this player
            PlayerService.getStatus().then(function(response) {
                var player = response.data;
                var playerId = player._id || player.name;
                $http.get(COUPON_API + '?q=playerId:"' + encodeURIComponent(playerId) + '"', {
                    headers: { Authorization: basicAuth }
                }).then(function(resp) {
                    vm.coupons = (resp.data || []).map(function(c) {
                        // Ensure date fields are Date objects
                        c.createdAt = new Date(c.createdAt);
                        c.expiry = new Date(c.expiry);
                        return c;
                    });
                    $scope.$applyAsync && $scope.$applyAsync();
                });
            });
        }

        vm.generateCoupon = function() {
            vm.error = null;
            vm.success = null;
            if (!vm.amountToConvert || vm.amountToConvert < 0.05) {
                vm.error = 'O valor mínimo para conversão é R$ 0,05.';
                return;
            }
            // Convert reais to points
            var pointsToDeduct = Math.floor(vm.amountToConvert / 0.05);
            if (pointsToDeduct < 1) {
                vm.error = 'O valor deve ser múltiplo de R$ 0,05.';
                return;
            }
            if (pointsToDeduct > vm.cashbackPoints) {
                vm.error = 'Você não possui cashback suficiente.';
                return;
            }
            vm.loading = true;
            PlayerService.getStatus().then(function(response) {
                var player = response.data;
                var playerId = player._id || player.name;
                // Confirm with user
                var reaisToDeduct = pointsToDeduct * 0.05;
                if (!window.confirm('Converter R$ ' + reaisToDeduct.toFixed(2) + ' de cashback em cupom? Isso não poderá ser desfeito.')) {
                    vm.loading = false;
                    return;
                }
                var purchasePayload = {
                    player: playerId,
                    item: CASHBACK_ITEM_ID,
                    total: pointsToDeduct
                };
                $http({
                    method: 'POST',
                    url: PURCHASE_API,
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    },
                    data: purchasePayload
                }).then(function(purchaseResp) {
                    var now = new Date();
                    var expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    var code = generateCouponCode(10);
                    var coupon = {
                        code: code,
                        value: reaisToDeduct,
                        playerId: playerId,
                        createdAt: now.toISOString(),
                        expiry: expiry.toISOString(),
                        redeemed: false
                    };
                    $http({
                        method: 'POST',
                        url: COUPON_API,
                        headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
                        data: coupon
                    }).then(function() {
                        vm.success = 'Cupom gerado com sucesso!';
                        vm.amountToConvert = null;
                        loadCashbackBalance();
                        loadCoupons();
                        $timeout(function() { vm.success = null; $scope.$applyAsync && $scope.$applyAsync(); }, 3500);
                    }).catch(function(err) {
                        vm.error = 'Erro ao salvar cupom. Tente novamente.';
                    }).finally(function() {
                        vm.loading = false;
                        $scope.$applyAsync && $scope.$applyAsync();
                    });
                }).catch(function(err) {
                    vm.error = 'Erro ao deduzir cashback. Tente novamente.';
                    vm.loading = false;
                    $scope.$applyAsync && $scope.$applyAsync();
                });
            });
        };

        function generateCouponCode(length) {
            var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            var code = '';
            for (var i = 0; i < length; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }

        vm.downloadCoupon = function(coupon) {
            var content = 'CUPOM DE CASHBACK\n\nCódigo: ' + coupon.code + '\nValor: R$ ' + coupon.value.toFixed(2) + '\nGerado em: ' + formatDate(coupon.createdAt) + '\nExpira em: ' + formatDate(coupon.expiry) + '\n';
            var blob = new Blob([content], { type: 'text/plain' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'cupom_cashback_' + coupon.code + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        };

        vm.copyCoupon = function(coupon) {
            var text = coupon.code;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    vm.success = 'Código copiado!';
                    $timeout(function() { vm.success = null; $scope.$applyAsync && $scope.$applyAsync(); }, 2000);
                });
            } else {
                // Fallback
                var textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                vm.success = 'Código copiado!';
                $timeout(function() { vm.success = null; $scope.$applyAsync && $scope.$applyAsync(); }, 2000);
            }
        };

        function formatDate(date) {
            var d = new Date(date);
            return d.toLocaleString('pt-BR');
        }
    }
})(); 