angular.module('app').controller('EventsController', function($scope, GoogleCalendarService) {
  $scope.events = [];
  $scope.loading = true;
  $scope.error = null;

  GoogleCalendarService.getUpcomingEvents().then(function(response) {
    $scope.events = (response.data.items || []).map(function(event) {
      // Try to extract an image URL from the description
      var imgMatch = event.description && event.description.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif)/i);
      var hasTime = event.start && event.start.dateTime;
      return {
        title: event.summary,
        date: hasTime ? event.start.dateTime : event.start.date,
        location: event.location,
        description: event.description,
        image: imgMatch ? imgMatch[0] : 'https://via.placeholder.com/120x120?text=Evento',
        time: hasTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'O dia inteiro',
        points: extractPoints(event.description)
      };
    });
  }).catch(function(err) {
    $scope.error = 'Erro ao carregar eventos.';
  }).finally(function() {
    $scope.loading = false;
  });

  // Helper: Extract points from description (e.g., "Pontos: 100")
  function extractPoints(desc) {
    if (!desc) return '';
    var match = desc.match(/Pontos?:\s*(\d+)/i);
    return match ? match[1] : '';
  }

  $scope.goBack = function() {
    window.history.back(); // or use $location.path('/dashboard') if you want to always go to dashboard
  };
}); 