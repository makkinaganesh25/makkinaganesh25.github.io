import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;

let root = (window as any).__root;
if (!root) {
  root = createRoot(container);
  (window as any).__root = root;
}

root.render(
  <App />,
);
