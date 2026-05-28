# CtrlGame

Веб-приложение ControlGame для хранения, поиска и управления коллекцией игр: пользователи, отзывы, корзина, желаемое, фильтрация, личный кабинет и покупки с баланса.

## Стек

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express + SQLite

## Быстрый старт

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
node seed.js
npm start
```

API: http://localhost:3001

### 2. Frontend (разработка)

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173 — запросы к `/api` проксируются на backend.

### 3. Production (один сервер)

```bash
cd frontend
npm run build
cd ../backend
npm start
```

Откройте http://localhost:3001

## Docker

Требуется **Docker Desktop** с запущенным движком (в трее — «Docker Desktop is running»).

```powershell
# из корня проекта
.\scripts\docker-up.ps1
```

Или вручную:

```bash
docker compose build
docker compose up -d
```

Сайт: http://localhost:3001 (фронтенд уже внутри образа).

Docker подключает **ваш локальный** файл `backend/db.sqlite` — те же игры и аккаунты, что при `npm start`. Перед запуском:

1. Файл `backend/db.sqlite` должен существовать (если нет: `cd backend && node seed.js`).
2. **Остановите** локальный backend на порту 3001 — два процесса не могут писать в одну SQLite одновременно.

Если раньше использовали том `ctrlgame-data`, он больше не нужен:

```bash
docker compose down
docker compose up -d --build
```

Пустая БД без файла `db.sqlite` — сначала создайте её локально через `node seed.js`.

### Если Docker «не работает»

| Симптом | Что сделать |
|---------|-------------|
| `Docker Desktop is unable to start` | Запустите Docker Desktop из Пуска, подождите 1–2 мин. Перезагрузите ПК. |
| `unable to start` / WSL | В PowerShell: `wsl --update`, затем в Docker: Settings → General → Use WSL 2. |
| Виртуализация | Диспетчер задач → Производительность → «Виртуализация: Включено». Если нет — включите VT-x/AMD-V в BIOS. |
| Hyper-V / конфликты | Docker Desktop → Troubleshoot → Restart / Reset to factory defaults (крайний случай). |
| Сборка падает на `bcrypt` | В образе уже стоят `python3`, `make`, `g++` — пересоберите: `docker compose build --no-cache`. |

Пока Docker недоступен, используйте **быстрый старт** выше (`npm start` + `npm run dev`) — функционал тот же.

Остановка: `docker compose down`. База остаётся в `backend/db.sqlite` на диске.

## Переменные окружения

Скопируйте `backend/.env.example` в `backend/.env`:

| Переменная | Описание |
|------------|----------|
| `JWT_SECRET` | Секрет для JWT (обязателен в production) |
| `JWT_EXPIRES_IN` | Срок жизни access-токена (по умолчанию `1h`) |
| `REFRESH_TOKEN_DAYS` | Срок жизни refresh-токена (по умолчанию `30`) |
| `CORS_ORIGIN` | URL фронтенда (`http://localhost:5173`) |
| `PORT` | Порт API (по умолчанию `3001`) |
| `DB_PATH` | Путь к SQLite (в Docker: `/data/db.sqlite`) |
| `MIN_PASSWORD_LENGTH` | Минимальная длина пароля (по умолчанию `6`) |

## Логины по умолчанию

| Роль | Логин | Пароль |
|------|--------|--------|
| Админ | `admin` | `admin123` |
| Пользователь | `user` | `user123` |

## Функционал

- **Магазин:** каталог с серверным поиском, фильтром и пагинацией, карусель, корзина, желаемое, покупка с баланса
- **Библиотека:** купленные игры, патчи/обновления
- **Страница игры:** галерея, описание, патчи, отзывы, рейтинг
- **Личный кабинет:** профиль, смена пароля, пополнение баланса, ссылка на желаемое
- **Админ:** игры, жанры, CRUD патчей (`POST/PUT/DELETE` для `/api/games/:id/patches` и `/api/patches/:id`)

## Структура backend

Маршруты разнесены по файлам в `backend/routes/`; точка входа — `app.js`, запуск — `server.js`. Каталог собирается в `services/catalogService.js`.

## CI/CD

Автоматические проверки на **GitHub Actions**:

| Workflow | Когда запускается | Что делает |
|----------|-------------------|------------|
| **CI** (`.github/workflows/ci.yml`) | push, Pull Request | Тесты backend, сборка frontend, сборка Docker |
| **CD** (`.github/workflows/cd.yml`) | push в `main` | Публикация Docker-образа в `ghcr.io` |

Подробное описание для отчёта: [docs/CI-CD.md](docs/CI-CD.md).

После `git push` откройте вкладку **Actions** в репозитории на GitHub.

## Тесты

```bash
cd backend
npm test
```

## Безопасность (учебный проект)

- Helmet, rate limit на вход/регистрацию
- JWT в `.env`, CORS только для dev-фронта
- Пароли хешируются bcrypt

Сессия: access-токен обновляется через `POST /api/refresh` (refresh-токен хранится в браузере). Добавление игр — только для роли `admin`.
