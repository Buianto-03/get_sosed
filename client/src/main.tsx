import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import axios from 'axios';
import App from '@app/App';
import { store } from '@app/store/store';
import { configureApiAuth } from '@shared/api/client';
import { API_URL } from '@shared/config/env';
import { authSchema } from '@entities/session/model/authModel';
import { clearAuth, setAccessToken } from '@entities/session/model/authSlice';
import '@shared/styles/foundations.module.scss';

configureApiAuth({
  getAccessToken: () => store.getState().auth.accessToken,
  refreshAccessToken: async () => {
    const response = await axios.get(`${API_URL}/tokens/refresh`);
    const { accessToken } = authSchema.parse(response.data);
    store.dispatch(setAccessToken(accessToken));
    return accessToken;
  },
  onUnauthorized: () => store.dispatch(clearAuth()),
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </Provider>,
);
