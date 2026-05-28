import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, isAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAuth) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    try {
      await register(fd.get('username'), fd.get('password'));
      navigate('/');
    } catch (err) {
      setError(err.data?.error || err.message || 'Ошибка регистрации');
    }
  };

  return (
    <main className="steam-main auth-page">
      <div className="auth-card">
        <h2>Создать аккаунт</h2>
        <form onSubmit={submit}>
          <label>
            Имя аккаунта
            <input name="username" required autoComplete="username" />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <small className="field-hint">Минимум 6 символов</small>
          </label>
          <button type="submit" className="btn-steam-green" style={{ width: '100%' }}>
            Зарегистрироваться
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p style={{ marginTop: '1.25rem', color: 'var(--steam-muted)', fontSize: 13 }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </main>
  );
}
