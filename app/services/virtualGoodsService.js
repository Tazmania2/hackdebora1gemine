(function() {
    'use strict';

    angular
        .module('app')
        .service('VirtualGoodsService', VirtualGoodsService);

    VirtualGoodsService.$inject = ['$http', 'FUNIFIER_API_CONFIG', 'AuthService'];

    function VirtualGoodsService($http, FUNIFIER_API_CONFIG, AuthService) {
        var service = {
            getVirtualGoods: getVirtualGoods,
            purchaseVirtualGood: purchaseVirtualGood,
            getPurchaseHistory: getPurchaseHistory,
            getVirtualGoodById: getVirtualGoodById
        };

        return service;

        function getVirtualGoods() {
            return $http({
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtual-goods',
                headers: {
                    'Authorization': AuthService.getToken(),
                    'Content-Type': 'application/json'
                }
            });
        }

        function getVirtualGoodById(goodId) {
            return $http({
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtual-goods/' + goodId,
                headers: {
                    'Authorization': AuthService.getToken(),
                    'Content-Type': 'application/json'
                }
            });
        }

        function purchaseVirtualGood(goodId, quantity) {
            return $http({
                method: 'POST',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtual-goods/' + goodId + '/purchase',
                headers: {
                    'Authorization': AuthService.getToken(),
                    'Content-Type': 'application/json'
                },
                data: {
                    quantity: quantity || 1
                }
            });
        }

        function getPurchaseHistory() {
            return $http({
                method: 'GET',
                url: FUNIFIER_API_CONFIG.baseUrl + '/virtual-goods/purchases',
                headers: {
                    'Authorization': AuthService.getToken(),
                    'Content-Type': 'application/json'
                }
            });
        }
    }
})(); 