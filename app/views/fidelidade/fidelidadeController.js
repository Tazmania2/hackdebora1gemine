angular.module('app').controller('FidelidadeController', function($scope, $timeout, PlayerService, $location) {
    var vm = this;
    // Piece definitions
    var pieces = [
        { id: 'EV2jc1P', img: 'https://imagizer.imageshack.com/img924/3846/4avJnI.png', pos: 'top-left' },
        { id: 'EVVEcSj', img: 'https://imagizer.imageshack.com/img922/2356/4cuiBX.png', pos: 'top-right' },
        { id: 'EVVEtaF', img: 'https://imagizer.imageshack.com/img923/6262/63eQCV.png', pos: 'bottom-left' },
        { id: 'EVXvM7O', img: 'https://imagizer.imageshack.com/img923/7351/vvdWNF.png', pos: 'bottom-right' },
        { id: 'EVXyNFP', img: 'https://imagizer.imageshack.com/img923/9439/5Y4Rph.png', pos: 'nose' }
    ];
    vm.pieces = pieces.map(function(p) { return Object.assign({}, p, { owned: false, anim: false }); });
    vm.loading = true;
    vm.error = null;
    vm.piecesOwned = 0;
    vm.piecesMissing = 5;
    vm.goBack = function() { $location.path('/dashboard'); };

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
}); 