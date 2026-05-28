# CI/CD в проекте CtrlGame

Материал для отчёта / защиты: что такое CI/CD, как это реализовано в репозитории и как проверить работу.

---

## 1. Что такое CI и CD

| Термин | Расшифровка | Смысл |
|--------|-------------|--------|
| **CI** | Continuous Integration — непрерывная интеграция | При каждом изменении кода (push, Pull Request) автоматически запускаются проверки: тесты, сборка, линтер. Ошибки видны до деплоя. |
| **CD** | Continuous Delivery / Deployment — непрерывная доставка / развёртывание | После успешного CI код автоматически доставляется на сервер или публикуется артефакт (Docker-образ, сайт). |

**Зачем это нужно (для преподавателя):**

- Меньше «у меня локально работает, а на сервере нет».
- История проверок в GitHub (зелёная галочка / красный крестик).
- Команда видит поломки сразу после коммита.
- Дипломный проект выглядит ближе к промышленной практике.

---

## 2. Что используется в CtrlGame

**Платформа:** [GitHub Actions](https://github.com/features/actions) — встроенный CI/CD в GitHub (бесплатно для учебных репозиториев).

**Файлы конфигурации:**

| Файл | Назначение |
|------|------------|
| `.github/workflows/ci.yml` | CI — на каждый push и PR |
| `.github/workflows/cd.yml` | CD — публикация Docker-образа при push в `main` |

Схема:

```
Разработчик → git push → GitHub
                           │
                           ├─► CI (ci.yml)
                           │     ├─ backend: npm test
                           │     ├─ frontend: npm run build
                           │     ├─ frontend: eslint (не блокирует)
                           │     └─ docker: сборка образа
                           │
                           └─► CD (cd.yml) — только ветка main
                                 └─ docker push → ghcr.io
```

---

## 3. Pipeline CI (подробно)

Workflow **CI** запускается при:

- push в ветки `main` или `master`;
- открытии / обновлении Pull Request в эти ветки.

### Job 1: `backend-test`

1. Клонируется репозиторий на виртуальную машину Ubuntu.
2. Устанавливается Node.js 20.
3. `npm ci` в папке `backend` (чистая установка по lock-файлу).
4. `node seed.js` — создаётся SQLite с демо-данными (нужно для тестов логина).
5. `npm test` — 10 автотестов (API, каталог, валидация, refresh-токены, права админа).

Если тест упал — весь workflow **failed** (красный статус).

### Job 2: `frontend-build`

1. `npm ci` в `frontend`.
2. `npm run build` — production-сборка Vite в `frontend/dist`.

Проверяется, что React-проект собирается без ошибок.

### Job 3: `frontend-lint` (опционально)

- Запускается ESLint.
- `continue-on-error: true` — не ломает CI, но показывает предупреждения (для постепенного исправления).

### Job 4: `docker-build`

- Запускается **после** успешных backend и frontend.
- Собирается Docker-образ по `Dockerfile` (без публикации).
- Проверяется, что контейнеризация не сломана.

---

## 4. Pipeline CD (подробно)

Workflow **CD** запускается при:

- push в ветку `main`;
- ручном запуске (кнопка **Run workflow** в GitHub).

### Job: `publish-docker`

1. Сборка Docker-образа приложения (backend + собранный frontend).
2. Публикация в **GitHub Container Registry** (`ghcr.io`):
   - тег `latest` для ветки main;
   - тег с хешем коммита для отката версий.

Образ можно скачать:

```bash
docker pull ghcr.io/<ваш-логин>/<имя-репозитория>:latest
```

Для CD используется встроенный `GITHUB_TOKEN` (настраивать секреты вручную не нужно для GitHub Packages в том же репозитории).

---

## 5. Как подключить к GitHub (пошагово)

1. Создайте репозиторий на GitHub (например `ctrlgame`).
2. В папке проекта:

```bash
git init
git add .
git commit -m "Initial commit with CI/CD"
git branch -M main
git remote add origin https://github.com/<логин>/<репозиторий>.git
git push -u origin main
```

3. Откройте вкладку **Actions** в репозитории — увидите запуск **CI** и **CD**.
4. Зелёная галочка ✅ — все проверки прошли.

Для Pull Request:

```bash
git checkout -b feature/my-change
# ... правки ...
git commit -am "Add feature"
git push -u origin feature/my-change
```

На GitHub создайте PR → CI запустится автоматически.

---

## 6. Как показать преподавателю

1. **Скриншот вкладки Actions** с успешным workflow CI.
2. **Скриншот списка jobs** (backend-test, frontend-build, docker-build).
3. **Фрагмент `ci.yml`** — «вот что проверяется автоматически».
4. **Объяснение устно:** «CI проверяет код при каждом коммите, CD публикует Docker-образ на main».

Можно приложить этот файл `docs/CI-CD.md` к отчёту.

---

## 7. Отличие от ручного деплоя

| Вручную | С CI/CD |
|---------|---------|
| Забыли запустить тесты | Тесты всегда на push |
| Собрали фронт с ошибкой | Сборка падает в CI |
| Разные версии Node у студентов | В CI всегда Node 20 на Ubuntu |
| Деплой «когда вспомнили» | CD после merge в main |

---

## 8. Возможные доработки (для зачёта «на отлично»)

- Деплой на VPS по SSH после CD.
- Публикация `frontend/dist` на GitHub Pages (только статика, API отдельно).
- Уведомления в Telegram при падении CI.
- Badge в README: `![CI](https://github.com/.../actions/workflows/ci.yml/badge.svg)`.
- Обязательный зелёный CI перед merge (branch protection в настройках репозитория).

---

## 9. Локальная проверка (без GitHub)

Те же шаги, что выполняет CI:

```bash
cd backend
npm ci
node seed.js
npm test

cd ../frontend
npm ci
npm run build

cd ..
docker compose build
```

Если всё прошло локально — CI на GitHub с высокой вероятностью тоже пройдёт.
