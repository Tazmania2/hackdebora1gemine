angular.module('app').factory('QuizService', function($http, FUNIFIER_API_CONFIG) {
    var service = {};

    // List all quizzes
    service.listQuizzes = function() {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/database/quiz',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });
    };

    // Get all questions for a quiz
    service.getQuizQuestions = function(quizId) {
        return $http({
            method: 'GET',
            url: FUNIFIER_API_CONFIG.baseUrl + '/quiz/' + quizId + '/question',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });
    };

    // Start a quiz (returns quiz_log)
    service.startQuiz = function(quizId, playerId) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/quiz/start',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            data: {
                quiz: quizId,
                player: playerId
            }
        });
    };

    // Submit answers in bulk
    service.submitAnswers = function(answers) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/question/log/bulk',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            data: answers
        });
    };

    // Finish quiz
    service.finishQuiz = function(quizLogId) {
        return $http({
            method: 'POST',
            url: FUNIFIER_API_CONFIG.baseUrl + '/quiz/finish',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            data: {
                quiz_log: quizLogId
            }
        });
    };

    return service;
}); 