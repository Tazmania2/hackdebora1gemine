angular.module('app').controller('FidelidadeController', function($scope, $timeout, PlayerService, $location) {
    var vm = this;
    // Piece definitions
    var pieces = [
        { id: 'EV2jc1P', img: 'https://s3.amazonaws.com/funifier/games/68252a212327f74f3a3d100d/images/682bcb302327f74f3a3e623a_original_1_pea_obtd.png', pos: 'top-left' },
        { id: 'EVVEcSj', img: 'https://s3.amazonaws.com/funifier/games/68252a212327f74f3a3d100d/images/682bcb442327f74f3a3e623c_original_2_pea_obtd.png', pos: 'top-right' },
        { id: 'EVVEtaF', img: 'https://s3.amazonaws.com/funifier/games/68252a212327f74f3a3d100d/images/682bcb5c2327f74f3a3e623e_original_3_pea_obtd.png', pos: 'bottom-left' },
        { id: 'EVXvM7O', img: 'https://s3.amazonaws.com/funifier/games/68252a212327f74f3a3d100d/images/682bcb762327f74f3a3e627b_original_4_pea_otbd.png', pos: 'bottom-right' },
        { id: 'EVXyNFP', img: 'https://s3.amazonaws.com/funifier/games/68252a212327f74f3a3d100d/images/682bcb8a2327f74f3a3e627d_original_5_pea_obtd.png', pos: 'nose' }
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