# CtrlGame

Веб-приложение ControlGame для хранения, поиска и управления коллекцией игр: пользователи, отзывы, корзина, желаемое, фильтрация, личный кабинет и покупки с баланса.

## Стек

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express + SQLite

## Запуск

Из корня проекта в **PowerShell**:

```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```

- `setup.ps1` — `npm install`, `.env`, `seed.js` (если БД ещё нет)
- `start.ps1` — сборка frontend + запуск backend

Сайт: **http://localhost:3001**

### Вручную

```bash
cd frontend
npm install
npm run build
cd ../backend
npm install
cp .env.example .env
node seed.js
npm start
```

База данных: `backend/db.sqlite` (создаётся командой `node seed.js`).

## Переменные окружения

Скопируйте `backend/.env.example` в `backend/.env`:

| Переменная | Описание |
|------------|----------|
| `JWT_SECRET` | Секрет для JWT |
| `JWT_EXPIRES_IN` | Срок access-токена (по умолчанию `1h`) |
| `REFRESH_TOKEN_DAYS` | Срок refresh-токена (по умолчанию `30`) |
| `CORS_ORIGIN` | URL сайта (`http://localhost:3001`) |
| `PORT` | Порт сервера (по умолчанию `3001`) |
| `DB_PATH` | Путь к SQLite (по умолчанию `backend/db.sqlite`) |
| `MIN_PASSWORD_LENGTH` | Минимальная длина пароля (по умолчанию `6`) |

## Логины по умолчанию

| Роль | Логин | Пароль |
|------|--------|--------|
| Админ | `admin` | `admin123` |
| Пользователь | `user` | `user123` |

## Функционал

- **Магазин:** каталог, поиск, фильтры, пагинация, акции, корзина, желаемое
- **Библиотека:** купленные игры, патчи
- **Страница игры:** галерея, отзывы, рейтинг
- **Профиль:** данные, пароль, баланс
- **Админ:** CRUD игр и жанров

## CI/CD (GitHub Actions)

| Workflow | Когда | Что делает |
|----------|-------|------------|
| **CI** (`.github/workflows/ci.yml`) | push, PR | Тесты, сборка frontend, ESLint, проверка Docker |
| **CD** (`.github/workflows/cd.yml`) | push в `main` | Публикация образа в `ghcr.io` |

Подробнее: [docs/CI-CD.md](docs/CI-CD.md).

Локальный запуск — через `npm` (см. выше). Docker для CD используется только на GitHub.

## Тесты

```bash
cd backend
npm test
```
