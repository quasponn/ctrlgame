import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TOPUPS = [100, 500, 1000, 5000];
const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?u=default';

export default function ProfilePage() {
  const { token, isAuth } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!isAuth) return undefined;

    let cancelled = false;

    api
      .getProfile(token)
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuth, token]);

  const startEdit = () => {
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
    });
    setEditing(true);
  };

  const resetPasswordForm = () => {
    setPasswordOpen(false);
    setPwd({ current: '', next: '', confirm: '' });
  };

  const cancelEdit = () => {
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
    });
    resetPasswordForm();
    setEditing(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(
        {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          avatar_url: form.avatar_url,
        },
        token
      );
      setUser(updated);
      setEditing(false);
      toast.success('Профиль сохранён');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      toast.error('Новый пароль и подтверждение не совпадают');
      return;
    }
    setPwdSaving(true);
    try {
      await api.changePassword(pwd.current, pwd.next, token);
      resetPasswordForm();
      toast.success('Пароль изменён');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  const topup = async (amount) => {
    setMsg('Пополнение...');
    try {
      const data = await api.topup(amount, token);
      setUser((u) => ({ ...u, balance: data.balance }));
      setMsg(`Баланс пополнен на ${amount} ₽`);
      toast.success(`Баланс пополнен на ${amount} ₽`);
    } catch (e) {
      setMsg(e.message);
      toast.error(e.message);
    }
  };

  if (!isAuth) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <main className="steam-main">
        <p>Загрузка...</p>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="steam-main">
        <p>Ошибка загрузки профиля.</p>
      </main>
    );
  }

  const avatarSrc = editing
    ? form.avatar_url || DEFAULT_AVATAR
    : user.avatar_url || DEFAULT_AVATAR;

  return (
    <main className="steam-main">
      <h1 className="steam-page-title">Личный кабинет</h1>
      <nav className="profile-nav">
        <Link to="/wishlist" className="profile-nav-btn">
          Желаемое
        </Link>
      </nav>

      <div id="profileInfo" className="steam-panel profile-panel">
        <div className="profile-layout">
          <img
            src={avatarSrc}
            alt=""
            className="profile-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <div className="profile-fields">
            <p>
              <b>Никнейм</b> {user.username}
            </p>
            <p>
              <b>Роль</b> {user.role}
            </p>

            {!editing ? (
              <>
                <p>
                  <b>Имя</b> {user.first_name || '—'}
                </p>
                <p>
                  <b>Фамилия</b> {user.last_name || '—'}
                </p>
                <p>
                  <b>Телефон</b> {user.phone || '—'}
                </p>
                <button type="button" className="btn-steam-blue profile-edit-toggle" onClick={startEdit}>
                  Редактировать профиль
                </button>
              </>
            ) : (
              <form className="profile-edit-form" onSubmit={saveProfile}>
                <label>
                  Имя
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="Иван"
                  />
                </label>
                <label>
                  Фамилия
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    placeholder="Иванов"
                  />
                </label>
                <label>
                  Телефон
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+79990000000"
                  />
                </label>
                <label>
                  URL аватара
                  <input
                    type="url"
                    value={form.avatar_url}
                    onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <div className="profile-password-section">
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => setPasswordOpen((open) => !open)}
                    aria-expanded={passwordOpen}
                  >
                    Сменить пароль
                    <span className={`profile-password-chevron ${passwordOpen ? 'is-open' : ''}`} aria-hidden>
                      ▾
                    </span>
                  </button>
                  {passwordOpen && (
                    <div className="profile-password-fields">
                      <label>
                        Текущий пароль
                        <input
                          type="password"
                          value={pwd.current}
                          onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                          autoComplete="current-password"
                        />
                      </label>
                      <label>
                        Новый пароль
                        <input
                          type="password"
                          value={pwd.next}
                          onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </label>
                      <label>
                        Подтверждение
                        <input
                          type="password"
                          value={pwd.confirm}
                          onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-steam-blue"
                        disabled={pwdSaving || !pwd.current || !pwd.next || !pwd.confirm}
                        onClick={changePassword}
                      >
                        {pwdSaving ? 'Сохранение...' : 'Обновить пароль'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="profile-edit-actions">
                  <button type="submit" className="btn-steam-green" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="btn-steam-ghost" onClick={cancelEdit} disabled={saving}>
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="profile-balance-block">
          <p className="profile-balance-label">Баланс ControlGame</p>
          <p className="profile-balance-value">{user.balance} ₽</p>
          <p className="profile-balance-hint">
            Пополните баланс и покупайте игры в магазине через корзину.
          </p>
          <div className="topup-buttons">
            {TOPUPS.map((a) => (
              <button key={a} type="button" className="topup-btn" onClick={() => topup(a)}>
                +{a} ₽
              </button>
            ))}
          </div>
          {msg && <p className="topup-msg">{msg}</p>}
        </div>
      </div>
    </main>
  );
}
