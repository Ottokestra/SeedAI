import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// import { worker } from './mocks/browser';

// MSW 비활성화 - 실제 백엔드 API 사용
// if (import.meta.env.DEV) {
//   worker.start({
//     onUnhandledRequest: 'bypass',
//   });
// }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

