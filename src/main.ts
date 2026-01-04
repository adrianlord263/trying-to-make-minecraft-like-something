import { Game } from './Game';

// Initialize game when DOM is ready
const game = new Game();
game.start();

// Handle window resize
window.addEventListener('resize', () => {
  game.resize();
});

// Prevent context menu on right click
window.addEventListener('contextmenu', (e) => e.preventDefault());
