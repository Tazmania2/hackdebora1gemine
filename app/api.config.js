angular.module('app')
  .constant('FUNIFIER_API_CONFIG', {
    clientId: window.FUNIFIER_API_KEY || '68252a212327f74f3a3d100d',
    apiKey:   window.FUNIFIER_API_KEY || '68252a212327f74f3a3d100d',
    service:  'https://service2.funifier.com/v3',
    baseUrl:  'https://service2.funifier.com/v3'
  }); 