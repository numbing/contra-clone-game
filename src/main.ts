import './style.css';
import { Game } from './game/game';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Unable to find #app element in the document.');
}

root.innerHTML = '';

await Game.start(root);
