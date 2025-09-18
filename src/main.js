import Game from './game/Game.js';

window.addEventListener('load', () => {
    const game = new Game();
    game.init();
    game.start();
});
