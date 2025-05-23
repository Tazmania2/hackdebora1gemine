angular.module('app').factory('GoogleCalendarService', function($http) {
  var service = {};
  var apiKey = 'AIzaSyDN3-G348NgJO66rqIyAdegFmyuzv596cs';
  var calendarId = '790bfd937dd1bb2a7a55d85b9238d440c2f1f2ee71db5e21704ca88c89d94dfc@group.calendar.google.com';

  service.getUpcomingEvents = function() {
    var now = new Date().toISOString();
    var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) +
      '/events?key=' + apiKey +
      '&orderBy=startTime&singleEvents=true&timeMin=' + now;
    return $http.get(url);
  };

  return service;
}); 