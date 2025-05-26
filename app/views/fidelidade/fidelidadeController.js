angular.module('app').controller('FidelidadeController', function($scope, $timeout, PlayerService, $location, $http) {
    var vm = this;
    // Piece definitions
    var pieces = [
        { id: 'EV2jc1P', img: 'https://imagizer.imageshack.com/img922/5794/1yRFPp.png', pos: 'top-left' },
        { id: 'EVVEcSj', img: 'https://imagizer.imageshack.com/img923/81/oloTZ2.png', pos: 'top-right' },
        { id: 'EVVEtaF', img: 'https://imagizer.imageshack.com/img923/6366/ODpOcj.png', pos: 'bottom-left' },
        { id: 'EVXvM7O', img: 'https://imagizer.imageshack.com/img924/7681/RmGJMs.png', pos: 'bottom-right' },
        { id: 'EVXyNFP', img: 'https://imagizer.imageshack.com/img922/816/UDeQ85.png', pos: 'nose' }
    ];
    vm.pieces = pieces.map(function(p) { return Object.assign({}, p, { owned: false, anim: false }); });
    vm.loading = true;
    vm.error = null;
    vm.piecesOwned = 0;
    vm.piecesMissing = 5;
    vm.goBack = function() { $location.path('/dashboard'); };
    vm.prize = null;
    vm.showPuzzleModal = !localStorage.getItem('puzzleTutorialSeen');
    vm.puzzleStep = 1;
    vm.puzzlePersonagemSrc = '/imagens/personagem1.png'; // Change if you want different images
    vm.puzzleButtonLabel = 'Próximo';

    PlayerService.getStatus().then(function(response) {
        var status = response.data;
        var ownedIds = Object.keys(status.catalog_items || {});
        vm.piecesOwned = 0;
        vm.pieces.forEach(function(piece, idx) {
            if (ownedIds.includes(piece.id) || (piece.pos === 'nose')) {
                piece.owned = true;
                vm.piecesOwned++;
            }
        });
        vm.piecesMissing = 5 - vm.piecesOwned;
        // Animate pieces in sequence
        var idx = 0;
        function animateNext() {
            while (idx < vm.pieces.length && !vm.pieces[idx].owned) idx++;
            if (idx < vm.pieces.length) {
                vm.pieces[idx].anim = true;
                $timeout(function() {
                    idx++;
                    animateNext();
                }, 400);
            }
        }
        animateNext();
        $scope.$applyAsync();
    }).catch(function() {
        vm.error = 'Erro ao carregar status do jogador.';
    }).finally(function() {
        vm.loading = false;
    });

    // Fetch prize info
    $http({
        method: 'GET',
        url: 'https://service2.funifier.com/v3/virtualgoods/item/EV2tJzk',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }
    }).then(function(res) {
        vm.prize = res.data;
        $scope.$applyAsync && $scope.$applyAsync();
    });

    vm.nextPuzzleStep = function() {
        if (vm.puzzleStep < 3) {
            vm.puzzleStep++;
            vm.puzzleButtonLabel = (vm.puzzleStep === 3) ? 'Fechar' : 'Próximo';
        } else {
            vm.showPuzzleModal = false;
            localStorage.setItem('puzzleTutorialSeen', 'true');
        }
    };
}); 