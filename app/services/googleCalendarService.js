angular.module('app').factory('GoogleCalendarService', function($http) {
  var apiKey = window.GOOGLE_CALENDAR_API_KEY || 'AIzaSyDN3-G348NgJO66rqIyAdegFmyuzv596cs';
  
  return {
    getEvents: function(calendarId, timeMin, timeMax) {
      var url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) +
        '/events?key=' + apiKey +
        '&timeMin=' + encodeURIComponent(timeMin) +
        '&timeMax=' + encodeURIComponent(timeMax) +
        '&singleEvents=true' +
        '&orderBy=startTime';
      
      return $http.get(url);
    }
  };
}); 