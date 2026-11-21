import { Outlet } from 'react-router-dom';
import { Navbar } from '../features/Component/Navbar.jsx';
import { AppFooter } from '../features/Component/AppFooter.jsx';
import { useAuth } from '../features/auth/hooks/useAuth.js';

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <>
      {user ? <Navbar /> : null}
      <Outlet />
      <AppFooter />
    </>
  );
}
