import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddGameModal from './AddGameModal';
import CartModal from './CartModal';
import Header from './Header';

export const GAMES_UPDATED_EVENT = 'games-updated';

export default function Layout() {
  const { isAuth, isAdmin } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [addGameOpen, setAddGameOpen] = useState(false);

  const notifyGamesUpdated = () => {
    window.dispatchEvent(new Event(GAMES_UPDATED_EVENT));
  };

  return (
    <div className="steam-app">
      <Header
        onCartClick={isAuth ? () => setCartOpen(true) : undefined}
        onAddGameClick={isAdmin ? () => setAddGameOpen(true) : undefined}
      />
      <div className="steam-content">
        <Outlet />
      </div>
      {cartOpen && <CartModal onClose={() => setCartOpen(false)} />}
      {addGameOpen && (
        <AddGameModal
          onClose={() => setAddGameOpen(false)}
          onAdded={notifyGamesUpdated}
        />
      )}
    </div>
  );
}
