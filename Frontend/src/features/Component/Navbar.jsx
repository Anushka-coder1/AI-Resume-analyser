import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/hooks/useAuth'
import './navigation.scss'

const navItems = [
  { name: 'Home', to: '/' },
  { name: 'Experiences', to: '/experiences' },
  { name: 'My Interviews', to: '/reports' },
]

export const Navbar = () => {
  const navigate = useNavigate()
  const { handleLogout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const logout = async () => {
    try {
      await handleLogout()
      navigate('/login')
    } catch {
      // The auth hook exposes the error to the application state.
    }
  }

  const closeMenu = () => setIsMenuOpen(false)

  return <header className="site-header">
    <div className="site-header__inner">
      <Link className="site-brand" to="/" onClick={closeMenu}>AI Resume Analyser</Link>
      <button type="button" className="menu-toggle" onClick={() => setIsMenuOpen((value) => !value)} aria-expanded={isMenuOpen} aria-controls="main-navigation">Menu</button>
      <nav id="main-navigation" className={`site-navigation ${isMenuOpen ? 'site-navigation--open' : ''}`} aria-label="Main navigation">
        {navItems.map((item) => <NavLink key={item.to} to={item.to} onClick={closeMenu} className={({ isActive }) => `site-navigation__link ${isActive ? 'site-navigation__link--active' : ''}`}>{item.name}</NavLink>)}
        <button type="button" className="site-navigation__logout" onClick={logout}>Logout</button>
      </nav>
    </div>
  </header>
}
