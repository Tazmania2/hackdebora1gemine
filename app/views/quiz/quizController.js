angular.module('app').controller('QuizController', function($scope, $location, $routeParams, QuizService, PlayerService, $rootScope, SuccessMessageService) {
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

    activate();

    function activate() {
        var quizId = $routeParams.quizId;
        if (quizId) {
            vm.mode = 'questions';
            loadQuizQuestions(quizId);
        } else {
            vm.mode = 'list';
            QuizService.listQuizzes().then(function(response) {
                vm.quizzes = response.data;
            }).catch(function(err) {
                vm.error = 'Erro ao carregar quizzes.';
            }).finally(function() {
                vm.loading = false;
            });
        }
    }

    function selectQuiz(quiz) {
        $location.path('/quiz/' + quiz._id);
    }

    function loadQuizQuestions(quizId) {
        vm.loading = true;
        QuizService.getQuizQuestions(quizId).then(function(response) {
            vm.questions = response.data;
            // Get quiz info for header
            QuizService.listQuizzes().then(function(resp) {
                vm.quiz = (resp.data || []).find(function(q) { return q._id === quizId; });
            });
            // Get player id for startQuiz
            var player = PlayerService.getCurrentPlayer();
            var playerId = player && player._id ? player._id : player && player.name ? player.name : null;
            if (!playerId) {
                vm.error = 'Jogador não encontrado.';
                vm.loading = false;
                return;
            }
            // Start the quiz and only finish loading when quizLogId is set
            return QuizService.startQuiz(quizId, playerId).then(function(resp) {
                vm.quizLogId = (resp.data.log && resp.data.log._id) || resp.data._id || resp.data.quiz_log || resp.data.quizLogId;
                console.log('Quiz started, quizLogId:', vm.quizLogId, resp.data);
                if (!vm.quizLogId) {
                    vm.error = 'Quiz não pôde ser iniciado (quizLogId ausente).';
                }
            }).catch(function(err) {
                vm.error = 'Erro ao iniciar quiz.';
                console.error('Erro ao iniciar quiz:', err);
            });
        }).catch(function(err) {
            vm.error = 'Erro ao carregar perguntas do quiz.';
            console.error('Erro ao carregar perguntas:', err);
        }).finally(function() {
            vm.loading = false;
        });
    }

    function selectAnswer(questionId, answer) {
        vm.answers[questionId] = [answer];
    }

    function isSelected(questionId, answer) {
        return vm.answers[questionId] && vm.answers[questionId].indexOf(answer) !== -1;
    }

    function submitQuiz() {
        if (!vm.quizLogId) {
            vm.error = 'Quiz não iniciado corretamente.';
            console.error('submitQuiz called but quizLogId is missing');
            return;
        }
        var player = PlayerService.getCurrentPlayer();
        var playerId = player && player._id ? player._id : player && player.name ? player.name : null;
        var bulkAnswers = vm.questions.map(function(q) {
            return {
                quiz: q.quiz,
                quiz_log: vm.quizLogId,
                question: q._id,
                answer: vm.answers[q._id] || [],
                player: playerId
            };
        });
        vm.loading = true;
        console.log('Submitting answers for quizLogId:', vm.quizLogId, bulkAnswers);
        QuizService.submitAnswers(bulkAnswers).then(function() {
            return QuizService.finishQuiz(vm.quizLogId);
        }).then(function(resp) {
            $rootScope.successMessage = SuccessMessageService.get('quiz_success');
            $location.path('/dashboard');
        }).catch(function(err) {
            vm.error = 'Erro ao enviar respostas.';
            console.error('Erro ao enviar respostas:', err);
        }).finally(function() {
            vm.loading = false;
        });
    }

    vm.goBack = function() {
        $location.path('/dashboard');
    };
}); 