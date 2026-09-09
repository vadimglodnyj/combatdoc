# CombatDOC (Медхар 2.0)

Система обліку військовослужбовців НГУ (в/ч 3029) — монорепозиторій з NestJS API, Angular PWA та Prisma ORM.

## Архітектура

```
combatdoc/
├── apps/
│   ├── api/          # NestJS API (порт 3000)
│   └── web/          # Angular PWA з NG-ZORRO (порт 4200)
├── packages/
│   └── shared/       # Спільні типи, enum, константи
├── docs/
│   └── PLAN.md       # Детальний план реалізації
└── docker-compose.yml
```

## Стек технологій

| Компонент | Технологія |
|-----------|------------|
| API | NestJS 10 |
| Frontend | Angular 17 PWA + NG-ZORRO (uk_UA) + date-fns |
| ORM | Prisma |
| База даних | PostgreSQL 16 |
| Аутентифікація | JWT (ролі: ADMIN, DOCTOR) |
| Monorepo | pnpm workspaces |
| Локалізація | Українська (uk_UA) |
| **UI Theme** | **Ant Design Pro Golden Purple (`#722ED1`)** |
| **Layout** | **Fixed Header + Fixed Sidebar + Fluid Content** |
| **Typography** | **Inter (variable font, Ukrainian Cyrillic)** |

## Швидкий старт

### Вимоги

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker + Docker Compose (для PostgreSQL)

### Встановлення

```bash
# 1. Клонувати репозиторій
git clone https://github.com/vadimglodnyj/combatdoc.git
cd combatdoc

# 2. Встановити залежності
pnpm install

# 3. Налаштувати змінні оточення
cp .env.example apps/api/.env
# Відредагувати apps/api/.env за потреби

# 4. Запустити PostgreSQL
pnpm docker:up

# 5. Виконати міграції та seed
cd apps/api
pnpm db:migrate
pnpm db:seed
cd ../..

# 6. Запустити dev-сервери (API + Web)
pnpm dev
```

Після цього:
- API: http://localhost:3000/api
- Health: http://localhost:3000/health
- Web: http://localhost:4200

### Початкові облікові дані

```
Email: admin@combatdoc.local
Пароль: admin123
```

⚠️ **Змініть пароль після першого входу!**

### Якщо `EADDRINUSE: address already in use :::3000`

Порт 3000 зайнятий попереднім API (часто після `nest --watch` на Windows). Angular завжди на **4200**.

Dev-режим сам звільняє порт, якщо його тримає старий Node-процес. Якщо помилка лишилась:

```bat
REM Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

```bash
# Linux / macOS
lsof -ti :3000 | xargs kill -9
# або
pnpm api:free-port
```

Потім знову `pnpm dev`. Інший порт API: `PORT=3001` у `apps/api/.env` і той самий URL у `apps/web/src/environments/environment.ts`.

## UI Theme & Design System

CombatDOC використовує **Ant Design Pro** стилістику з **Golden Purple** (`#722ED1`) як основним кольором.

### Конфігурація теми

- **Layout**: Classic Side Menu (фіксований сайдбар зліва + фіксований header зверху)
- **Content Width**: Fluid (на всю ширину)
- **Primary Color**: Golden Purple `#722ED1` (кнопки, активні пункти меню, лінки, акценти)
- **Typography**: Inter variable font (самохостінг через `@fontsource-variable/inter`, підтримка української кирилиці)
- **Background**: Світлі корпоративні поверхні (білі картки на `#f0f2f5` фоні)

Детальніше про дизайн-систему та responsive patterns — у `docs/DESIGN.md`.

### Responsive поведінка

- **Desktop (≥768px)**: Бічне меню + таблиці з фільтрами
- **Mobile (<768px)**: Drawer меню + картки замість таблиць

## Структура модулів

### NestJS API (`apps/api/src`)

| Модуль | Призначення |
|--------|-------------|
| `auth` | JWT аутентифікація, створення користувачів (ADMIN only) |
| `service-members` | Картки військовослужбовців |
| `dictionaries` | Звання, підрозділи, ЛПЗ, ролі лікарів |
| `episodes` | Епізоди лікування (COMBAT/SOMATIC) |
| `consultations` | Консультації та обстеження (PLANNED/DONE) |
| `care-segments` | Сегменти лікування (HOSP, AMB, VLK_LEAVE тощо) |
| `vlk` | Рішення ВЛК |
| `journal` | Журнал подій (append-only, clinical/system) |
| `documents` | Генерація DOCX (характеристики, рапорти, відомості) |
| `whatsapp` | Інтеграція з 2 чатами WhatsApp |
| `discord` | Нагадування та нотифікації Discord (обов'язково) |
| `tasks` | Trello-подібний борд задач |
| `payments` | Калькулятор виплат з контролем довідки №5 |
| `import` | Імпорт Excel/Turso з preview |
| `control` | Агрегації для вкладок контролю (стаціонар, поранені, ВЛК...) |

### Angular Web (`apps/web/src/app`)

| Feature | Опис |
|---------|------|
| `login` | Вхід (email + пароль) |
| `members` | Список військовослужбовців |
| `episodes` | Епізоди лікування |
| `consultations` | Планові/завершені консультації |
| `segments` | Сегменти лікування (стаціонар, поліклініка, відпустка) |
| `control` | 7 вкладок контролю (стаціонар, поранені, ВЛК, довготривале...) |
| `tasks` | Канбан-борд задач |
| `documents` | Генерація документів DOCX |
| `payments` | Оплата з перевіркою довідки №5 |
| `import` | Імпорт даних з Excel/Turso |

## Prisma схема (основні сутності)

- **User** — користувачі системи (ADMIN/DOCTOR)
- **ServiceMember** — картка військовослужбовця
- **Episode** — епізод по діагнозу (COMBAT/SOMATIC)
- **Consultation** — візит/обстеження (VISIT/EXAM)
- **CareSegment** — режим обліку (HOSP, AMB, VLK_LEAVE...)
- **InjuryCertificate** — довідка №5 (для COMBAT)
- **VlkDecision** — рішення ВЛК
- **JournalEntry** — журнал подій (CLINICAL/SYSTEM)
- **Task** — задачі команди (TODO/DOING/DONE)
- **TeamMember** — члени команди (Discord sync)
- **PaymentPeriod** — періоди виплат
- **Rank, Unit, Facility, PractitionerRole** — довідники

## Скрипти

```bash
# Монорепо
pnpm install:all         # Встановити всі залежності
pnpm dev                 # API + Web одночасно
pnpm clean               # Видалити node_modules

# API
pnpm api:dev             # Nest dev mode
pnpm api:build           # Білд продакшн
pnpm api:start           # Запустити продакшн

# База даних
pnpm db:migrate          # Виконати міграції
pnpm db:studio           # Prisma Studio UI
pnpm db:seed             # Заповнити початкові дані

# Web
pnpm web:dev             # Angular dev server
pnpm web:build           # Білд продакшн
pnpm web:start           # ng serve

# Docker
pnpm docker:up           # Запустити PostgreSQL
pnpm docker:down         # Зупинити контейнери
```

## Змінні оточення

Скопіюйте `.env.example` в `apps/api/.env` та налаштуйте:

```env
# База даних
DATABASE_URL="postgresql://combatdoc:combatdoc_dev@localhost:5432/combatdoc"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Discord (отримати з Discord Developer Portal)
DISCORD_BOT_TOKEN=
DISCORD_WEBHOOK_URL=

# WhatsApp (залежить від провайдера)
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
WHATSAPP_CHAT_1_ID=
WHATSAPP_CHAT_2_ID=

# Опціонально
GEMINI_API_KEY=          # Для OCR довідки №5
```

⚠️ **Секрети не зберігаються в git!** Налаштуйте їх у `.env` або Cursor Dashboard > Secrets.

## Міграції

Prisma автоматично генерує міграції:

```bash
cd apps/api

# Створити нову міграцію після зміни schema.prisma
pnpm prisma migrate dev --name <migration-name>

# Застосувати міграції на продакшні
pnpm prisma migrate deploy

# Згенерувати Prisma Client
pnpm prisma generate
```

## PWA

Angular PWA налаштована з `ngsw-config.json`:
- Кешування статики (app shell)
- Lazy-load assets
- Офлайн-режим базовий (full offline — не MVP)

Для білду PWA:

```bash
cd apps/web
pnpm build
# Service worker буде згенеровано автоматично
```

## Особливості архітектури

### JWT Auth
- Admin створює користувачів через `POST /api/auth/users` (ADMIN role only)
- Email + пароль, без PIN
- Ролі: `ADMIN` | `DOCTOR`

### Журнал подій (Journal)
- Append-only, транзакційний
- Клінічні події з `patientId`
- Системні події (реєстрація, ролі) без `patientId`
- Тип `NOTE` не потрібен

### Лічільник 120 днів
Рахує лише: `HOSP`, `AMB`, `VLK_LEAVE`, `REHAB`.  
Після перерви «в строю» — з останнього безперервного відрізка.

### Довідка №5
- Обов'язкова для `Episode.nature = COMBAT`
- Статуси: `MISSING` | `PENDING` | `VERIFIED` | `REJECTED`
- OCR + класифікація → підтвердження медиком або авто-VERIFIED
- Без `VERIFIED` — блок/попередження в модулі оплати

### Discord обов'язковий
- Нагадування (довідка №5, PLANNED на дату, довготривале)
- Поліклінічний список на дату
- Webhook/токени тільки в секретах

---

## ✅ Iteration 2: Episodes + Довідка №5 (DONE)

### Функціонал

#### API
- **Episodes CRUD**: створення, перегляд, редагування, закриття, повторне відкриття
- **Query filters**: `serviceMemberId`, `nature` (COMBAT/SOMATIC), `isActive`, `missingCert`
- **InjuryCertificate**: завантаження файлів (PDF/JPG/PNG), status transitions
- **Статуси довідки**: `MISSING` → `PENDING` (після upload) → `VERIFIED`/`REJECTED` (медик)
- **Auto-створення** cert зі статусом `MISSING` для COMBAT епізодів
- **Journal entries**: логування змін епізоду та сертифіката
- **Task creation**: автоматичні задачі при REJECTED/MISSING статусі
- **Payment блокування**: `paymentBlockedByCert` flag для контролю виплат

#### UI (Angular)
- **Member detail → Episodes tab**: 
  - Список епізодів з badges (nature, status, cert)
  - Create modal (діагноз, nature, дата)
  - Warning для COMBAT (довідка обов'язкова)
- **Episode detail page** (`/episodes/:id`):
  - Header з тегами nature/active/cert status
  - Actions: close/reopen
  - Certificate card: upload PDF/фото, change status (VERIFIED/REJECTED)
  - Consultations/segments placeholders
- **Control → Довідки №5 tab**:
  - Таблиця COMBAT епізодів без VERIFIED cert
  - Фільтри та статистика
  - Лінки на episode detail

#### Seed Data
- 2 demo service members
- 1 COMBAT episode (Коваленко) з MISSING cert
- 1 SOMATIC episode (Шевченко) закритий

### Як випробувати

```bash
# 1. Seed база даних
cd apps/api
pnpm db:seed

# 2. Запустити сервери
cd ../..
pnpm dev

# 3. Увійти
# URL: http://localhost:4200
# Логін: admin@combatdoc.local / admin123

# 4. Перейти до картки Коваленка
# Особовий склад → Коваленко Іван Петрович

# 5. Episodes tab → бачимо COMBAT епізод з червоним badge MISSING

# 6. Натиснути "Переглянути" → Episode detail page

# 7. Завантажити файл (PDF/JPG/PNG < 10MB) → статус PENDING

# 8. Змінити статус → VERIFIED або REJECTED (з причиною)

# 9. Control → Довідки №5 → таблиця COMBAT без верифікації
```

### Технічні деталі
- Файли зберігаються в `UPLOAD_PATH` (env або `./uploads/injury-certs`)
- OCR/ML класифікація — placeholder (Gemini integration TODO)
- Routes: `/episodes/:id`, `/control` (tab "Довідки №5")
- NG-ZORRO components: Upload, Alert, Modal, Popconfirm, Radio

---

## Що НЕ робимо в MVP

- ❌ ЄСОЗ інтеграція
- ❌ Аптека
- ❌ DOCX «направлення»
- ❌ Повний offline (PWA basic)
- ❌ Детальна бізнес-логіка (імплементація в наступних ітераціях)

## Наступні кроки

Див. `docs/PLAN.md` — розділ «8. Порядок реалізації (ітерації)».

**Iteration 0 (цей scaffold):** monorepo + Nest + Angular + Prisma + Auth + health endpoint.

**Iteration 1+:** CRUD ServiceMember, імпорт Excel штату, епізоди з довідкою №5, консультації, сегменти, контроль, документи, оплата.

## Ліцензія

Внутрішній проєкт в/ч 3029. Не для публічного використання.

## Контакти

- Команда: див. Discord sync
- Репо: https://github.com/vadimglodnyj/combatdoc
