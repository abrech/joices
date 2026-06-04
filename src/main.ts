import './styles/global.css';
import { gameEngine } from './game/GameEngine';
import { mountApp } from './ui/App';

const app = document.querySelector<HTMLDivElement>('#app')!;
mountApp(app, gameEngine);
