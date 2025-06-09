angular.module('app').controller('QuizController', function($scope, $location, $routeParams, QuizService, PlayerService, $rootScope, SuccessMessageService, AuthService, $timeout) {
    var vm = this;
    vm.loading = true;
    vm.error = null;
    vm.quizzes = [];
    vm.quiz = null;
    vm.questions = [];
    vm.answers = {};
    vm.quizLogId = null;
    vm.selectQuiz = selectQuiz;
    vm.submitQuiz = submitQuiz;
    vm.selectAnswer = selectAnswer;
    vm.isSelected = isSelected;
    vm.mode = 'list'; // 'list' or 'questions'
    vm.currentQuestionIndex = 0;
    vm.isSubmitting = false;
    vm.quizCompleted = false;

    activate();

    function activate() {
        var quizId = $routeParams.quizId;
        if (quizId) {
            vm.mode = 'questions';
            loadQuizQuestions(quizId);
        } else {
            vm.mode = 'list';
            loadAvailableQuizzes();
        }
    }

    function loadAvailableQuizzes() {
        vm.loading = true;
        QuizService.getAllQuizzes()
            .then(function(response) {
                vm.quizzes = response.data || [];
                vm.loading = false;
            })
            .catch(function(error) {
                vm.error = 'Erro ao carregar quizzes disponíveis';
                vm.loading = false;
            });
    }

    function selectQuiz(quiz) {
        $location.path('/quiz/' + quiz._id);
    }

    function loadQuizQuestions(quizId) {
        vm.loading = true;
        loadQuiz(quizId);
    }

    function loadQuiz(quizId) {
        vm.loading = true;
        
        // Get quiz info for header
        QuizService.getQuiz(quizId)
            .then(function(resp) {
                vm.quiz = resp.data;
                // Get player id for startQuiz
                var currentPlayer = AuthService.getCurrentPlayer();
                var playerId = currentPlayer ? currentPlayer._id : null;
                
                if (!playerId) {
                    vm.error = 'Usuário não autenticado';
                    vm.loading = false;
                    return;
                }

                // Start the quiz and only finish loading when quizLogId is set
                return QuizService.startQuiz(quizId, playerId);
            })
            .then(function(resp) {
                vm.quizLogId = resp.data.quizLogId;
                return loadQuestions(vm.quiz._id);
            })
            .then(function() {
                vm.loading = false;
            })
            .catch(function(error) {
                vm.error = 'Erro ao carregar quiz';
                vm.loading = false;
            });
    }

    function loadQuestions(quizId) {
        return QuizService.getQuestions(quizId)
            .then(function(response) {
                vm.questions = response.data || [];
                if (vm.questions.length === 0) {
                    vm.error = 'Nenhuma pergunta encontrada para este quiz';
                }
            })
            .catch(function(error) {
                vm.error = 'Erro ao carregar perguntas';
            });
    }

    function selectAnswer(questionId, answer) {
        vm.answers[questionId] = answer;
    }

    function isSelected(questionId, answer) {
        return vm.answers[questionId] && vm.answers[questionId].indexOf(answer) !== -1;
    }

    function submitQuiz() {
        if (!vm.quizLogId) {
            vm.error = 'Erro: Quiz não foi iniciado corretamente';
            return;
        }

        vm.isSubmitting = true;
        
        // Convert answers to the required format
        var bulkAnswers = vm.questions.map(function(q) {
            var selectedAnswer = vm.answers[q._id];
            return {
                questionLogId: q._id,
                answer: selectedAnswer || '',
                quizLogId: vm.quizLogId
            };
        });

        QuizService.submitAnswers(bulkAnswers)
            .then(function() {
                return QuizService.finishQuiz(vm.quizLogId);
            })
            .then(function() {
                vm.quizCompleted = true;
                vm.isSubmitting = false;
                $timeout(function() {
                    vm.goToDashboard();
                }, 2000);
            })
            .catch(function(error) {
                vm.error = 'Erro ao enviar respostas';
                vm.isSubmitting = false;
            });
    }

    function goToDashboard() {
        $location.path('/dashboard');
    }

    vm.goBack = function() {
        $location.path('/dashboard');
    };
}); 