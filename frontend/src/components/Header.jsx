import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }) => (isActive ? 'nav-active' : undefined);

export default function Header({ onCartClick, onAddGameClick }) {
  const { isAuth, isAdmin, username, logout, cartIds, wishlistIds } = useAuth();
  const cartCount = cartIds.length;
  const wishCount = wishlistIds.length;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="steam-header">
      <Link to="/" className="steam-header-brand">
        <span className="steam-logo">CG</span>
        <span>CtrlGame</span>
      </Link>
      <nav className="steam-nav">
        <NavLink to="/" end className={navClass}>
          Магазин
        </NavLink>
        {isAuth && (
          <NavLink to="/library" className={navClass}>
            Библиотека
          </NavLink>
        )}
        {isAuth && (
          <NavLink to="/wishlist" className={navClass}>
            Желаемое
            {wishCount > 0 && <span className="nav-badge">{wishCount}</span>}
          </NavLink>
        )}
        {isAuth && (
          <NavLink to="/profile" className={navClass}>
            Кабинет
          </NavLink>
        )}
        {!isAuth && (
          <NavLink to="/login" className={navClass}>
            Вход
          </NavLink>
        )}
        {!isAuth && (
          <NavLink to="/register" className={navClass}>
            Регистрация
          </NavLink>
        )}
      </nav>
      <div className="steam-header-right">
        {isAdmin && onAddGameClick && (
          <button type="button" className="steam-btn-admin" onClick={onAddGameClick}>
            + Игра
          </button>
        )}
        {isAuth && <span className="steam-user-pill">{username}</span>}
        {isAuth && onCartClick && (
          <button type="button" className="steam-btn-cart" onClick={onCartClick}>
            Корзина
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </button>
        )}
        {isAuth && (
          <button type="button" className="steam-btn-logout" onClick={handleLogout}>
            Выйти
          </button>
        )}
      </div>
    </header>
  );
}
