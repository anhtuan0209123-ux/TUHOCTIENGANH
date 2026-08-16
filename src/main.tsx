import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGeminiFetchInterceptor } from './utils/geminiKey.ts';
import { AuthProvider } from './context/AuthContext.tsx';

setupGeminiFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

