import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatGamePrice } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';

export default function CartModal({ onClose }) {
  const { token, refreshGameState } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cart, profile] = await Promise.all([api.getCart(token), api.getProfile(token)]);
      setItems(cart);
      setBalance(profile.balance);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [cart, profile] = await Promise.all([api.getCart(token), api.getProfile(token)]);
        if (!cancelled) {
          setItems(cart);
          setBalance(profile.balance);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const total = items.reduce((s, i) => s + i.price, 0);

  const remove = async (id) => {
    await api.removeFromCart(id, token);
    await refreshGameState(token);
    await load();
  };

  const clear = async () => {
    await api.clearCart(token);
    await refreshGameState(token);
    await load();
  };

  const buy = async () => {
    setBuying(true);
    try {
      const data = await api.checkout(token);
      await refreshGameState(token);
      toast.success(`Покупка успешна! Списано ${data.spent} ₽. Остаток: ${data.balance} ₽`);
      setConfirmOpen(false);
      onClose();
    } catch (e) {
      if (e.data?.error === 'Insufficient balance') {
        toast.error(
          `${e.data.message}. Нужно: ${e.data.required} ₽, на балансе: ${e.data.balance} ₽.`
        );
      } else {
        toast.error(e.message);
      }
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
          <h2>Корзина</h2>
          {loading ? (
            <p>Загрузка...</p>
          ) : !items.length ? (
            <p>Корзина пуста.</p>
          ) : (
            <>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Игра</th>
                    <th>Цена</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{formatGamePrice(item.price)}</td>
                      <td>
                        <button type="button" onClick={() => remove(item.id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <b>Итого:</b> {total} ₽
              </p>
              <p>
                Ваш баланс: <b>{balance} ₽</b>
              </p>
              <button type="button" className="btn-steam-ghost" onClick={clear}>
                Очистить корзину
              </button>
              <button
                type="button"
                className="btn-steam-green"
                disabled={buying}
                onClick={() => setConfirmOpen(true)}
                style={{ marginLeft: '0.75em' }}
              >
                Купить
              </button>
              <p className="cart-hint">
                Оплата списывается с баланса. Пополнить — в{' '}
                <Link to="/profile" onClick={onClose}>
                  личном кабинете
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Подтвердить покупку"
        message={`Купить игры из корзины за ${total} ₽ с баланса?`}
        confirmLabel="Купить"
        loading={buying}
        onConfirm={buy}
        onCancel={() => !buying && setConfirmOpen(false)}
      />
    </>
  );
}
