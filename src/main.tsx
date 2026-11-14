import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import App from './App.tsx';
import './styles.css';

// Данные меняются раз в несколько часов, поэтому держим их в кеше 5 минут и не перезапрашиваем при фокусе окна.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 2 },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('В index.html нет элемента #root');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
