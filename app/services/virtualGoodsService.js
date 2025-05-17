(function() {
    'use strict';

    angular
        .module('app')
        .service('VirtualGoodsService', VirtualGoodsService);

    VirtualGoodsService.$inject = ['$http', 'API_URL'];

    function VirtualGoodsService($http, API_URL) {
        var service = {
            getVirtualGoods: getVirtualGoods,
            purchaseVirtualGood: purchaseVirtualGood,
            getPurchaseHistory: getPurchaseHistory,
            getVirtualGoodById: getVirtualGoodById
        };

        return service;

        function getVirtualGoods() {
            return $http.get(API_URL + '/virtual-goods');
        }

        function getVirtualGoodById(goodId) {
            return $http.get(API_URL + '/virtual-goods/' + goodId);
        }

        function purchaseVirtualGood(goodId, quantity) {
            return $http.post(API_URL + '/virtual-goods/' + goodId + '/purchase', {
                quantity: quantity || 1
            });
        }

        function getPurchaseHistory() {
            return $http.get(API_URL + '/virtual-goods/purchases');
        }
    }
})(); 