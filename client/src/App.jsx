import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './store/authSlice';
import { AppRoutes } from './routes/AppRoutes';
import { getAccessToken } from './services/api';
import { CookieConsentBanner } from './components/legal/CookieConsentBanner';

export const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (getAccessToken()) {
      dispatch(fetchCurrentUser());
    }

    const handleLogoutEvent = () => {
      dispatch({ type: 'auth/logoutUser/fulfilled' });
    };

    window.addEventListener('fk_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('fk_auth_logout', handleLogoutEvent);
  }, [dispatch]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
      <CookieConsentBanner />
    </BrowserRouter>
  );
};

export default App;
