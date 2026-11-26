# 🐧 Penguin Store — "The Great Penguin Store Migration" 🐟🧊

> "A well-organized store is like a well-organized penguin colony: everyone knows where to go."

Full-stack e-commerce project built with Node.js, Express, Pug and MongoDB: a server-rendered storefront and a separate admin panel, with zero client-side JavaScript.

- 📦 **Repository:** https://github.com/JuanCastro-H/PenguinStore-FullStack-Challenge-1-TheHatch

---

## 🎬 Description

This project simulates the migration of a penguin fish shop (Larry's iceberg stall) to an online store.

It is made of two independent Node.js applications that share one MongoDB database:

- **Storefront (`/frontend`)** — where customers browse products and place orders.
- **Admin panel (`/backend`)** — where the shop owner manages categories, products and orders.

The challenge has one golden rule: *penguins hate JavaScript in their browsers*. Every page is rendered on the server with Pug, and forms use plain HTML. There is no AJAX and no client-side script.

The system includes:

- A public catalog with stock-aware product listing
- A checkout form that creates orders and reserves stock
- A protected admin panel with login, categories, products and orders
- A REST API for authentication, categories and products
- Session-based security with CSRF protection and account lockout

---

## 🧠 Objective

Practice building a complete server-rendered web application:

- Node.js and Express with the MVC pattern
- Server-side rendering with Pug
- MongoDB data modeling with Mongoose
- Cookie-based authentication with hashed passwords
- Role-based access control
- CSRF protection on public and private forms
- Stock consistency when several customers buy at once
- Separating a public storefront from an administrative application
- Styling with Tailwind CSS

---

## 🛠️ Technologies Used

### Backend
- **Node.js**
- **Express 5**
- **Pug** (server-side templates)

### Database
- **MongoDB**
- **Mongoose 9**

### Security
- **Argon2** (password hashing)
- **jsonwebtoken** (JWT stored in an `httpOnly` cookie)
- **Helmet** and **CORS** (admin application)
- **cookie-parser**
- **Node `crypto`** (SHA-256 token hashes, CSRF tokens)

### Styling
- **Tailwind CSS 4** (compiled with the Tailwind CLI)

### Tooling
- **dotenv**
- **Docker** (optional, to run MongoDB locally)

---

## 🧩 System Architecture

```text
                CUSTOMER                         SHOP OWNER
                    │                                │
                    ▼                                ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │  Storefront          │        │  Admin application   │
        │  Express + Pug       │  HTTP  │  Express + Pug       │
        │  Port 3000           │ ─────► │  Port 4000           │
        │                      │ GET    │  REST API + panel    │
        └──────────┬───────────┘/products└──────────┬───────────┘
                   │                               │
                   │  orders + stock               │  categories, products,
                   │                               │  orders, users, sessions
                   ▼                               ▼
                ┌───────────────────────────────────────┐
                │               MongoDB                 │
                │            (shared database)          │
                └───────────────────────────────────────┘
```

| Component | Port | Responsibility |
|---|---:|---|
| Storefront (`frontend/`) | `3000` | Catalog, checkout form, order creation, stock reservation, order confirmation |
| Admin application (`backend/`) | `4000` | Authentication, REST API, admin panel for categories, products and orders |
| MongoDB | `27017` | Shared persistence |

### How the two apps talk

- **Reading the catalog:** the storefront calls the admin app's `GET /products` over HTTP and shows only active products with stock.
- **Writing orders:** the storefront saves orders and decrements stock directly in MongoDB, using its own models.

This is a shared-database architecture, not a microservices one.

### Internal layers

```text
Routes → Middleware → Controllers → Services → Models → MongoDB
                          ↓
                    Views (Pug)
```

---

## ⚙️ How It Works

### 🔹 Customer Flow

1. The customer opens the store and sees active products that have stock.
2. In the checkout page, they pick a quantity for each product and enter name, email and igloo address.
3. The form is submitted with a CSRF token.
4. The server validates the data. Prices and names come from the catalog, never from the form.
5. For every product, the stock is reserved with an **atomic conditional update**: it only succeeds if the product is active, has enough stock and still has the expected price.
6. If any product fails, the stock already reserved is restored and the customer gets a clear conflict message.
7. If everything succeeds, the order is saved with a snapshot of each item (name, price, quantity, subtotal) and a total.
8. The customer is redirected to a confirmation page with the order number.

### 🔹 Admin Flow

1. The owner signs in at `/admin/login` (the form carries a CSRF token).
2. Credentials are checked against the Argon2 hash. Every attempt is logged.
3. After 5 consecutive failures the account is locked for 15 minutes.
4. On success, a session is stored in MongoDB and a JWT is sent in an `httpOnly` cookie (15 minutes).
5. Only users with the `admin` role can enter the panel.
6. From the panel, the owner manages categories, products and orders, and marks orders as delivered.
7. Logging out revokes the session on the server.

---

## 🔐 Security Measures

| Threat | Protection |
|---|---|
| Plain-text passwords | Argon2 hashing |
| Session theft via JavaScript | JWT in an `httpOnly` cookie; the apps ship no client-side scripts |
| Cookie leakage over HTTP | `secure` flag enabled when `NODE_ENV=production` |
| Reusing a logged-out session | Sessions stored in MongoDB with expiry and revocation |
| Stolen database | Only SHA-256 hashes of tokens are stored, never the tokens |
| CSRF (admin) | Cookie + form field (or header), also checked against a hash stored in the session |
| CSRF (storefront) | Cookie + hidden form field, compared in constant time |
| Brute force | Account lock after 5 failed attempts (15 minutes) and a log of every attempt |
| Privilege escalation | Role check: only `admin` reaches the panel and the write endpoints |
| Price tampering | Prices are read server-side, never trusted from the form |
| Overselling | Atomic stock reservation with rollback on failure |
| Invalid data | Mongoose schema validation and server-side normalization of customer data |
| Template injection | Pug escapes interpolated values by default |
| Security headers | Helmet and an origin-restricted CORS policy in the admin application |
| Leaked secrets | Configuration in environment variables; `.env` files are git-ignored |

---

## 📡 Routes

### Storefront (`http://localhost:3000`)

| Method | Route | Description |
|---|---|---|
| GET | `/store` | Product catalog |
| GET | `/store/checkout` | Checkout form |
| POST | `/store/orders` | Create an order (CSRF protected) |
| GET | `/store/orders/:orderId/confirmation` | Order confirmation page |
| GET | `/health` | Health check |

### Admin panel (`http://localhost:4000`)

| Method | Route | Description |
|---|---|---|
| GET / POST | `/admin/login` | Login form and submission |
| POST | `/admin/logout` | Sign out |
| GET | `/admin/dashboard` | Summary of products and categories |
| GET | `/admin/categories` | List categories |
| GET / POST | `/admin/categories/new`, `/admin/categories` | Create a category |
| GET / POST | `/admin/categories/:id/edit` | Edit a category |
| POST | `/admin/categories/:id/toggle-status` | Activate or deactivate |
| POST | `/admin/categories/:id/delete` | Delete (blocked if it has products) |
| GET | `/admin/products` | List products |
| GET / POST | `/admin/products/new`, `/admin/products` | Create a product |
| GET / POST | `/admin/products/:id/edit` | Edit a product |
| POST | `/admin/products/:id/toggle-status` | Activate or deactivate |
| POST | `/admin/products/:id/delete` | Delete a product |
| GET | `/admin/orders` | List orders |
| POST | `/admin/orders/:orderId/deliver` | Mark an order as delivered |

All panel routes except the login require an authenticated `admin`, and every state-changing request requires a valid CSRF token.

### REST API (`http://localhost:4000`)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | API status |
| POST | `/auth/register` | Public | Create a user account (role `user`) |
| POST | `/auth/login` | Public | Log in, sets session cookies |
| GET | `/auth/me` | Authenticated | Current user |
| POST | `/auth/logout` | Authenticated + CSRF | Revoke the session |
| GET | `/categories`, `/categories/:id` | Public | Read categories |
| POST / PUT / DELETE | `/categories`, `/categories/:id` | Admin + CSRF | Manage categories |
| GET | `/products`, `/products/:id` | Public | Read products (with category) |
| POST / PUT / DELETE | `/products`, `/products/:id` | Admin + CSRF | Manage products |

Requests authenticated with a `Bearer` token skip the CSRF check; requests that use the session cookie must send the `X-CSRF-Token` header.

---

## 📦 Data Model

```text
Category ──< Product
Role ──< User ──< Session
              └──< LoginAttempt
Order  (customer + items snapshot)
```

| Model | Purpose |
|---|---|
| `Category` | Name, auto-generated slug, description, active flag |
| `Product` | Name, description, price, stock, category, image URLs, active flag |
| `Order` | Customer data, items with name, price, quantity and subtotal, total, status (`pending` or `delivered`) |
| `User` | Email, password hash, role, active flag, failed attempts, lock expiry |
| `Role` | `user` and `admin` |
| `Session` | Hash of the JWT, hash of the CSRF token, expiry and revocation date |
| `LoginAttempt` | Email, IP address and result of every login attempt |

Prices and stock are whole numbers (prices are displayed in Guaraníes, `G.`). Orders keep a snapshot of each product, so they stay readable if a product is edited or removed later.

---

## 📂 Project Structure

```text
PenguinStore-FullStack-Challenge-1-TheHatch/

├── backend/                        # Admin application (port 4000)
│   ├── scripts/
│   │   └── seed.js                 # Creates roles and the first admin
│   ├── src/
│   │   ├── config/                 # Database connection
│   │   ├── controllers/            # Auth, categories, products, admin views
│   │   ├── middleware/             # Authentication, roles, CSRF
│   │   ├── models/                 # Category, Product, Order, User, Role, Session, LoginAttempt
│   │   ├── routes/
│   │   ├── services/               # Auth, JWT, sessions, passwords, CSRF
│   │   ├── views/                  # Pug: login, dashboard, categories, products, orders
│   │   ├── public/css/             # Tailwind input and compiled CSS
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/                       # Storefront (port 3000)
│   ├── src/
│   │   ├── config/                 # Database connection and backend URL
│   │   ├── controllers/            # Catalog, checkout, confirmation
│   │   ├── middleware/             # CSRF
│   │   ├── models/                 # Order, InventoryProduct
│   │   ├── routes/
│   │   ├── services/               # Catalog, inventory (stock), orders
│   │   ├── views/store/            # Pug: catalog, checkout, confirmation
│   │   ├── public/css/             # Tailwind input and compiled CSS
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- Node.js (a recent LTS version) and npm
- MongoDB (local install, Docker or Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/JuanCastro-H/PenguinStore-FullStack-Challenge-1-TheHatch.git
cd PenguinStore-FullStack-Challenge-1-TheHatch
```

### 2. Start MongoDB

With Docker (example):

```bash
docker run -d --name penguin-mongo -p 27017:27017 -v penguin_mongo_data:/data/db mongo:7
```

Any other MongoDB instance works too. You only need its connection string, for example:

```text
mongodb://127.0.0.1:27017/penguin_store
```

### 3. Set up the admin application (backend)

```bash
cd backend
npm install
cp .env.example .env
```

Fill in the `.env` file (see the variables below), then create the roles and the first admin account:

```bash
npm run seed
```

Start the server:

```bash
npm start
```

### 4. Set up the storefront (frontend)

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Start the admin application **first**: the storefront reads its product catalog from it.

### 📌 Environment Variables

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | Server port (default `4000`) |
| `MONGODB_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime, for example `15m` |
| `ADMIN_EMAIL` | Email of the first admin, used by `npm run seed` |
| `ADMIN_PASSWORD` | Password of the first admin, used by `npm run seed` |
| `FRONTEND_URL` | Storefront URL, used as the allowed CORS origin (required), for example `http://localhost:3000` |
| `NODE_ENV` | `development` or `production` (enables the `secure` cookie flag) |

**Frontend (`frontend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3000`) |
| `MONGODB_URL` | MongoDB connection string (same database as the backend) |
| `BACKEND_URL` | Admin application URL (default `http://localhost:4000`) |
| `NODE_ENV` | `development` or `production` |

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never commit your real `.env` files. They are already git-ignored, and `.env.example` is the only version tracked.

### 🎨 Tailwind CSS (optional)

The compiled stylesheets are included in the repository, so no build step is needed to run the project. If you change Tailwind classes in the views, rebuild the CSS in the app you edited:

```bash
npm run css:build
```

---

## ▶️ Usage

Once both applications are running:

| What | URL |
|---|---|
| Storefront | http://localhost:3000/store |
| Admin login | http://localhost:4000/admin/login |

> The storefront lives under `/store`; the root URL of each application has no page.

### Admin workflow

1. Open the admin login and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set before running the seed.
2. Create at least one category at `/admin/categories`.
3. Create products at `/admin/products` (price and stock are whole numbers; images are URLs, one per line).
4. Review customer orders at `/admin/orders` and mark them as delivered.

### Customer workflow

1. Open the storefront and browse the products.
2. Go to the checkout page and choose a quantity for each product you want.
3. Enter your name, email and igloo address, and confirm the order.
4. Keep the order number shown in the confirmation page.

### Quick API example

```bash
# Log in (stores the session cookies in cookies.txt)
curl -i -c cookies.txt -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'

# Check the current user
curl http://localhost:4000/auth/me -b cookies.txt

# List products
curl http://localhost:4000/products
```

---

## 📈 Key Features

✔ Two independent applications with separate responsibilities  
✔ Server-rendered pages with Pug and no client-side JavaScript  
✔ Shared MongoDB database with Mongoose models  
✔ Public catalog showing only active products with stock  
✔ Checkout with server-side validation of customer data  
✔ Atomic stock reservation with rollback when an order fails  
✔ Prices always read from the server, never from the form  
✔ Order snapshots (name, price, quantity, subtotal) and totals  
✔ Admin panel for categories, products and orders  
✔ Order status workflow: pending → delivered  
✔ Categories cannot be deleted while they have products  
✔ REST API for authentication, categories and products  
✔ Argon2 password hashing  
✔ Cookie sessions with server-side revocation  
✔ Role-based access control (`user` / `admin`)  
✔ CSRF protection on the storefront and the admin panel  
✔ Account lockout and login attempt logging  
✔ Seed script for roles and the first admin  
✔ Tailwind CSS interface  

---

## 🧃 Possible Improvements

- Add dashboard shortcuts to products and categories, and a delete button to the product list in the panel
- Upload product images from the panel (for example with `multer`) instead of pasting URLs
- Configure Helmet's Content Security Policy so external product images render in the panel, and enable Helmet in the storefront
- Show friendly error pages in the storefront instead of plain-text messages
- Restrict or remove public registration (`POST /auth/register`)
- Add IP-based rate limiting for login and checkout
- Use MongoDB transactions instead of manual stock rollback
- Add product search, filtering and pagination to the catalog
- Add a Docker Compose setup that starts MongoDB and both applications
- Add automated tests for the storefront order flow

---

## 👨‍💻 Author

**Juan Castro**

---

# 🇪🇸 Resumen en Español

Penguin Store es un proyecto full-stack de comercio electrónico desarrollado con Node.js, Express, Pug y MongoDB. Simula la migración de la pescadería de Larry el Pingüino a una tienda online.

El sistema está formado por dos aplicaciones independientes que comparten una misma base de datos: una tienda pública donde los clientes ven productos y hacen pedidos, y un panel de administración donde la dueña gestiona categorías, productos y pedidos. Siguiendo la regla del reto, ninguna de las dos usa JavaScript del lado del cliente: todo se renderiza en el servidor.

---

## 🎯 Objetivo

El proyecto fue desarrollado para practicar:

- arquitectura MVC con Node.js y Express,
- renderizado del lado del servidor con Pug,
- modelado de datos en MongoDB con Mongoose,
- autenticación con cookies y contraseñas hasheadas,
- control de acceso por roles,
- protección CSRF,
- consistencia del stock cuando varios clientes compran a la vez,
- separación entre una tienda pública y una aplicación administrativa.

---

## ⚙️ Funcionamiento

- La tienda obtiene el catálogo desde la API de la aplicación administrativa y muestra solo productos activos con stock.
- Al confirmar un pedido, el servidor valida los datos, toma los precios del catálogo y reserva el stock con una actualización atómica. Si algo falla, devuelve el stock reservado.
- El pedido se guarda con una copia de los datos de cada producto y queda en estado pendiente.
- El panel administrativo exige iniciar sesión con rol de administrador. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.
- Desde el panel se gestionan categorías, productos y pedidos, y se marcan las entregas.

---

## 📊 Características destacadas

- Dos aplicaciones con responsabilidades separadas y base de datos compartida
- Páginas renderizadas en el servidor, sin JavaScript en el navegador
- Reserva atómica de stock con reversión ante errores
- Panel de administración protegido con sesiones, roles y CSRF
- Bloqueo de cuentas y registro de intentos de inicio de sesión
- API REST para autenticación, categorías y productos
- Interfaz con Tailwind CSS

---

## 🧠 Conclusión

Penguin Store demuestra cómo integrar dos aplicaciones con responsabilidades distintas sobre los mismos datos, cuidando la seguridad y la consistencia del inventario.

Este enfoque permite:
- separar la experiencia de compra de la administración del negocio,
- evitar vender más stock del disponible y confiar solo en precios del servidor,
- proteger las operaciones sensibles con sesiones, roles y CSRF,
- y ampliar el sistema con nuevas funciones sin rehacer su arquitectura.