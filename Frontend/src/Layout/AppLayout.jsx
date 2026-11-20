import { Outlet } from 'react-router-dom';
import { Navbar } from '../features/Component/Navbar.jsx';
import { AppFooter } from '../features/Component/AppFooter.jsx';

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <AppFooter />
    </>
  );
}
