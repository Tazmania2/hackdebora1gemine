(function() {
  'use strict';
  angular.module('app').factory('SuccessMessageService', SuccessMessageService);
  SuccessMessageService.$inject = ['$http', '$q'];
  function SuccessMessageService($http, $q) {
    var messages = null;
    var apiUrl = 'https://service2.funifier.com/v3/database/success_messages__c';
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    return {
      fetchAll: fetchAll,
      get: get
    };
    function fetchAll() {
      if (messages) return $q.resolve(messages);
      return $http.get(apiUrl, {
        headers: { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
      }).then(function(resp) {
        messages = {};
        if (Array.isArray(resp.data)) {
          resp.data.forEach(function(msg) {
            messages[msg._id] = msg.message;
          });
        }
        return messages;
      });
    }
    function get(key) {
      if (!messages) return null;
      return messages[key] || '';
    }
  }
})(); 