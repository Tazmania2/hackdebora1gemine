(function() {
  'use strict';
  angular.module('app').factory('ThemeConfigService', ThemeConfigService);
  ThemeConfigService.$inject = ['$http', '$q'];
  function ThemeConfigService($http, $q) {
    var configCache = null;
    var collection = 'myapp_config__c'; // Change if you want a different collection
    var configId = 'global';
    var apiUrl = 'https://service2.funifier.com/v3/database/' + collection + '?strict=true&q=_id:\'' + configId + '\'';
    var basicAuth = 'Basic NjgyNTJhMjEyMzI3Zjc0ZjNhM2QxMDBkOjY4MjYwNWY2MjMyN2Y3NGYzYTNkMjQ4ZQ==';
    return {
      getConfig: getConfig,
      applyConfig: applyConfig
    };
    function getConfig() {
      if (configCache) return $q.resolve(configCache);
      return $http.get(apiUrl, {
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json'
        }
      }).then(function(resp) {
        var cfg = (resp.data && resp.data[0]) ? resp.data[0] : {};
        configCache = cfg;
        return cfg;
      });
    }
    function applyConfig(cfg) {
      if (!cfg) return;
      var root = document.documentElement;
      if (cfg.background_color) root.style.setProperty('--background-dark', cfg.background_color);
      if (cfg.viewport_bg) root.style.setProperty('--background-card', cfg.viewport_bg);
      if (cfg.header_bg) root.style.setProperty('--background-header', cfg.header_bg);
      if (cfg.primary_color) root.style.setProperty('--primary-color', cfg.primary_color);
      if (cfg.secondary_color) root.style.setProperty('--secondary-color', cfg.secondary_color);
      if (cfg.font_color) root.style.setProperty('--text-color', cfg.font_color);
      if (cfg.font) {
        root.style.setProperty('--font-family', cfg.font);
        // Dynamically load Google Font if not already loaded
        if (!document.getElementById('dynamic-font-link') && cfg.font.match(/^[A-Za-z ]+$/)) {
          var formattedFont = cfg.font.replace(/ /g, '+');
          var link = document.createElement('link');
          link.id = 'dynamic-font-link';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css?family=' + formattedFont;
          document.head.appendChild(link);
        }
      }
      if (cfg.logo) {
        // Set logo globally if you have a global logo element, or expose via service
        // Example: document.getElementById('main-logo').src = cfg.logo;
      }
    }
  }
})(); 