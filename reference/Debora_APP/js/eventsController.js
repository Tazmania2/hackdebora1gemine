// eventsController.js
// Integração com Sympla via proxy local para listar eventos e exibir detalhes

angular.module('interstellarApp')
  .controller('EventsController', ['$scope', '$http', function($scope, $http) {
    console.log('[EventsController] Inicializado');
    const SYMPLA_EVENTS_URL = 'http://localhost:3001/events';

    $scope.events = [];
    $scope.loading = true;
    $scope.error = false;
    $scope.selectedEvent = null;
    $scope.modalOpen = false;

    $scope.fetchEvents = function() {
      console.log('[EventsController] Buscando eventos...');
      $scope.loading = true;
      $http.get(SYMPLA_EVENTS_URL)
        .then(function(response) {
          $scope.events = response.data.data || [];
          $scope.loading = false;
          console.log('[EventsController] Eventos carregados:', $scope.events);
        })
        .catch(function(error) {
          $scope.events = [];
          $scope.loading = false;
          $scope.error = true;
          console.error('[EventsController] Erro ao buscar eventos:', error);
        });
    };

    $scope.showEventDetails = function(eventId) {
      console.log('[EventsController] Detalhes do evento solicitado:', eventId);
      $scope.selectedEvent = null;
      $scope.modalOpen = true;
      $scope.modalLoading = true;
      $http.get(SYMPLA_EVENTS_URL + '/' + eventId)
        .then(function(response) {
          $scope.selectedEvent = response.data.data;
          $scope.modalLoading = false;
          console.log('[EventsController] Detalhes do evento carregados:', $scope.selectedEvent);
          console.log('[EventsController] modalOpen:', $scope.modalOpen);
          if (!$scope.$$phase) $scope.$apply();
        })
        .catch(function(error) {
          $scope.modalLoading = false;
          console.error('[EventsController] Erro ao buscar detalhes do evento:', error);
        });
    };

    // Função de log para depuração do botão Detalhes
    $scope.logAndShowEventDetails = function(event) {
      console.log('[EventsController] Botão Detalhes clicado para:', event);
      //alert('Botão Detalhes clicado para: ' + event.name + ' (ID: ' + event.id + ')');
      $scope.showEventDetails(event.id);
    };


    $scope.closeModal = function() {
      $scope.modalOpen = false;
      $scope.selectedEvent = null;
    };

    $scope.formatDate = function(dateStr) {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };

    // Buscar eventos ao carregar o controller
    $scope.modalOpen = false; // Garante que o modal inicia fechado
    $scope.fetchEvents();
    console.log('[EventsController] fetchEvents chamado na inicialização');   
  }]);
