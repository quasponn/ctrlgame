import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAuth) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    try {
      await login(fd.get('username'), fd.get('password'));
      navigate('/');
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка входа');
    }
  };

  return (
    <main className="steam-main auth-page">
      <div className="auth-card">
        <h2>Вход в CtrlGame</h2>
        <form onSubmit={submit}>
          <label>
            Имя аккаунта
            <input name="username" required autoComplete="username" />
          </label>
          <label>
            Пароль
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" className="btn-steam-green" style={{ width: '100%' }}>
            Войти
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p style={{ marginTop: '1.25rem', color: 'var(--steam-muted)', fontSize: 13 }}>
          Нет аккаунта? <Link to="/register">Создать аккаунт</Link>
        </p>
      </div>
    </main>
  );
}
