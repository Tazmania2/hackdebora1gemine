(function() {
    'use strict';

    angular
        .module('app')
        .constant('API_URL', 'https://service2.funifier.com/v3')
        .constant('API_CONFIG', {
            apiKey: '68252a212327f74f3a3d100d',
            appSecret: '682605f62327f74f3a3d248e'
        })
        .constant('FUNIFIER_API_CONFIG', {
            baseUrl: 'https://service2.funifier.com/v3',
            apiKey: '68252a212327f74f3a3d100d',
            appSecret: '682605f62327f74f3a3d248e'
        });
})(); 