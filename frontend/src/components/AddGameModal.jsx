import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AddGameModal({ onClose, onAdded }) {
  const { token } = useAuth();
  const [genres, setGenres] = useState([]);
  const [msg, setMsg] = useState('');
  const [genreMsg, setGenreMsg] = useState('');

  useEffect(() => {
    api.getGenres().then(setGenres);
  }, []);

  const addGame = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const genreIds = [...e.target.genres.selectedOptions].map((o) => Number(o.value));
    setMsg('');
    try {
      const game = await api.createGame(
        {
          title: fd.get('title'),
          description: fd.get('description'),
          release_year: fd.get('release_year') || null,
        },
        token
      );
      await api.setGameGenres(game.id, genreIds, token);
      setMsg('Игра добавлена!');
      e.target.reset();
      onAdded?.();
      setTimeout(onClose, 600);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const addGenre = async (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name');
    setGenreMsg('');
    try {
      await api.createGenre(name, token);
      setGenreMsg('Жанр добавлен!');
      e.target.reset();
      setGenres(await api.getGenres());
    } catch (err) {
      setGenreMsg(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>Добавить игру</h2>
        <form onSubmit={addGame}>
          <label>
            Название
            <input name="title" required />
          </label>
          <label>
            Описание
            <textarea name="description" rows={3} />
          </label>
          <label>
            Год выпуска
            <input type="number" name="release_year" />
          </label>
          <label>
            Жанры
            <select name="genres" multiple size={4}>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-steam-green">
            Добавить игру
          </button>
        </form>
        {msg && <p className="topup-msg">{msg}</p>}

        <hr className="modal-divider" />
        <h3 className="modal-subtitle">Новый жанр</h3>
        <form onSubmit={addGenre} className="modal-inline-form">
          <label style={{ flex: 1, marginBottom: 0 }}>
            Название жанра
            <input name="name" required />
          </label>
          <button type="submit" className="btn-steam-blue" style={{ alignSelf: 'flex-end' }}>
            Добавить жанр
          </button>
        </form>
        {genreMsg && <p className="topup-msg">{genreMsg}</p>}
      </div>
    </div>
  );
}
