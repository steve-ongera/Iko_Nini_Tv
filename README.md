# Iko Nini TV — E-Commerce Platform

> A full-featured e-commerce platform inspired by Jumia, built for the Kenyan market.
> Django REST Framework backend · React frontend · M-Pesa + PayPal payments.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Full Project Structure](#full-project-structure)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Environment Variables](#environment-variables)
7. [API Endpoints](#api-endpoints)
8. [Payment Integrations](#payment-integrations)
9. [Deployment](#deployment)

---

## Project Overview

**Iko Nini TV** is a Kenyan e-commerce marketplace supporting:
- Product listings with categories, variants, and SEO-friendly slugs
- County-based pickup stations (e.g. Mombasa → Shanzu, Bamburi, Majaoni, Likoni, Mtwapa) with per-station delivery costs
- Home delivery with location-based pricing
- M-Pesa STK Push (Daraja API) with active callback polling
- PayPal checkout
- Account registration & login via email/password (JWT)
- Order management, tracking, reviews

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | Python 3.11, Django 5, Django REST Framework     |
| Auth        | Simple JWT (email + password)                   |
| Payments    | M-Pesa Daraja API, PayPal REST SDK              |
| Database    | PostgreSQL (production), SQLite (development)   |
| Cache/Queue | Redis + Celery (for async M-Pesa polling)       |
| Frontend    | React 18, Vite, React Router v6                 |
| Styling     | Bootstrap 5 + Bootstrap Icons                   |
| State       | React Context API                               |
| HTTP        | Axios                                           |

---

## Full Project Structure

```
ikonini-tv/
│
├── README.md
├── .env                          # Root env (never commit)
├── .gitignore
│
├── backend/                      # Django project root
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                      # Backend-specific env
│   │
│   ├── config/                   # Django project package
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py               # Main URL conf
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── store/                    # ONE core application
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py             # All models (Users, Products, Orders, Payments, Delivery…)
│       ├── serializers.py        # DRF serializers
│       ├── views.py              # All API views
│       ├── urls.py               # App-level URL patterns
│       ├── permissions.py        # Custom DRF permissions
│       ├── filters.py            # django-filter FilterSets
│       ├── pagination.py         # Custom pagination
│       ├── signals.py            # Django signals
│       ├── tasks.py              # Celery async tasks (M-Pesa polling)
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── mpesa.py          # Daraja API helper
│       │   ├── paypal.py         # PayPal helper
│       │   └── email.py          # Transactional email helpers
│       └── tests/
│           ├── __init__.py
│           ├── test_models.py
│           ├── test_views.py
│           └── test_payments.py
│
└── frontend/                     # React / Vite project root
    ├── index.html                # Entry HTML with SEO, Bootstrap, icons
    ├── vite.config.js
    ├── package.json
    ├── .env                      # VITE_ prefixed vars
    │
    └── src/
        ├── main.jsx              # React DOM entry
        ├── App.jsx               # Router + providers
        │
        ├── services/
        │   └── api.js            # Axios instance + ALL API calls
        │
        ├── context/
        │   ├── AuthContext.jsx   # Login, register, JWT refresh
        │   ├── CartContext.jsx   # Cart state, add/remove/clear
        │   ├── WishlistContext.jsx
        │   └── ToastContext.jsx  # Global toast notifications
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── MobileNav.jsx
        │   ├── product/
        │   │   ├── ProductCard.jsx
        │   │   ├── ProductGrid.jsx
        │   │   ├── ProductCarousel.jsx
        │   │   ├── RatingStars.jsx
        │   │   └── ReviewCard.jsx
        │   ├── cart/
        │   │   ├── CartItem.jsx
        │   │   └── CartSummary.jsx
        │   ├── checkout/
        │   │   ├── DeliveryForm.jsx
        │   │   ├── PickupStationPicker.jsx
        │   │   ├── MpesaPayment.jsx
        │   │   └── PaypalButton.jsx
        │   ├── account/
        │   │   ├── AddressBook.jsx
        │   │   └── ProfileForm.jsx
        │   └── common/
        │       ├── Loader.jsx
        │       ├── EmptyState.jsx
        │       ├── Breadcrumb.jsx
        │       ├── Pagination.jsx
        │       ├── SearchBar.jsx
        │       └── ProtectedRoute.jsx
        │
        └── pages/
            ├── Index.jsx           # Homepage — hero, flash sales, categories
            ├── Store.jsx           # Product listing with filters & search
            ├── ProductDetail.jsx   # PDP — gallery, variants, reviews, recently viewed, related
            ├── Cart.jsx            # Cart page
            ├── Checkout.jsx        # Multi-step checkout
            ├── OrderConfirm.jsx    # Post-purchase confirmation
            ├── Account.jsx         # Account dashboard
            ├── Orders.jsx          # Order list
            ├── OrderDetail.jsx     # Single order with timeline
            ├── Wishlist.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            ├── ResetPassword.jsx
            └── NotFound.jsx
```

---

## Backend Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Configure environment (see .env section below)
cp .env.example .env

# 4. Run migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Seed counties & pickup stations
python manage.py seed_locations

# 7. Start dev server
python manage.py runserver

# 8. Start Celery worker (separate terminal) for M-Pesa polling
celery -A config worker -l info
```

### requirements.txt (key packages)

```
Django==5.0.6
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-filter==24.2
django-cors-headers==4.4.0
Pillow==10.4.0
psycopg2-binary==2.9.9
redis==5.0.7
celery==5.4.0
requests==2.32.3
python-decouple==3.8
dj-database-url==2.2.0
whitenoise==6.7.0
```

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_BASE_URL
npm run dev                   # starts on http://localhost:5173
npm run build                 # production build
```

---

## Environment Variables

### backend/.env

```ini
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://user:pass@localhost:5432/ikonini_db

# M-Pesa Daraja
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=
MPESA_ENV=sandbox                # sandbox | production
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox               # sandbox | live

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Redis
REDIS_URL=redis://localhost:6379/0
```

### frontend/.env

```ini
VITE_API_BASE_URL=http://localhost:8000/api
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register with email + password |
| POST | `/api/auth/login/` | Obtain JWT access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PUT | `/api/auth/profile/` | Get / update profile |
| POST | `/api/auth/password/change/` | Change password |
| POST | `/api/auth/password/reset/` | Request reset email |
| POST | `/api/auth/password/reset/confirm/` | Confirm reset |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List products (filter, search, sort) |
| GET | `/api/products/{slug}/` | Product detail |
| GET | `/api/products/featured/` | Featured products |
| GET | `/api/products/flash-sales/` | Flash sale items |
| GET | `/api/categories/` | Category tree |
| GET | `/api/categories/{slug}/` | Category with products |
| GET | `/api/brands/` | Brand list |
| POST | `/api/products/{slug}/reviews/` | Submit review (auth) |
| GET | `/api/products/{slug}/reviews/` | Product reviews |

### Cart & Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cart/` | Get or create cart |
| POST | `/api/cart/items/` | Add item |
| PUT/DELETE | `/api/cart/items/{id}/` | Update / remove item |
| DELETE | `/api/cart/clear/` | Clear cart |
| GET/POST | `/api/wishlist/` | Wishlist |
| DELETE | `/api/wishlist/{id}/` | Remove wishlist item |

### Delivery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/counties/` | All counties |
| GET | `/api/counties/{id}/pickup-stations/` | Stations per county |
| GET | `/api/pickup-stations/{id}/` | Station detail + cost |
| POST | `/api/delivery/calculate/` | Calculate delivery cost |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/` | Place order |
| GET | `/api/orders/` | My orders |
| GET | `/api/orders/{order_number}/` | Order detail |
| POST | `/api/orders/{order_number}/cancel/` | Cancel order |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/mpesa/initiate/` | STK Push |
| POST | `/api/payments/mpesa/callback/` | Daraja callback (public) |
| GET | `/api/payments/mpesa/status/{checkout_request_id}/` | Poll payment status |
| POST | `/api/payments/paypal/create-order/` | Create PayPal order |
| POST | `/api/payments/paypal/capture/{paypal_order_id}/` | Capture PayPal order |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/?q=&category=&min_price=&max_price=&brand=&sort=` | Full-text search |

---

## Payment Integrations

### M-Pesa STK Push Flow
1. Customer clicks "Pay with M-Pesa" → frontend calls `/api/payments/mpesa/initiate/`
2. Backend calls Daraja `stkpush` → customer gets prompt on phone
3. Daraja posts result to `/api/payments/mpesa/callback/`
4. Celery task polls `/api/payments/mpesa/status/{id}/` every 5 s (up to 2 min)
5. Frontend polls same endpoint → updates UI when confirmed/failed

### PayPal Flow
1. Frontend loads PayPal JS SDK with `VITE_PAYPAL_CLIENT_ID`
2. On approve → calls `/api/payments/paypal/capture/{id}/`
3. Backend verifies & marks order paid

---

## Delivery Model

Every **County** has multiple **PickupStation** records:

```
Mombasa County
 ├── Shanzu Pickup Station        KES 150
 ├── Bamburi Pickup Station       KES 150
 ├── Majaoni Pickup Station       KES 200
 ├── Likoni Pickup Station        KES 200
 └── Mtwapa Pickup Station        KES 180

Nairobi County
 ├── CBD - Moi Avenue             KES 100
 ├── Westlands                    KES 120
 ├── Eastleigh                    KES 130
 ├── Karen                        KES 180
 └── Kasarani                     KES 150
```

Home delivery cost is set per county. Customer chooses pickup or home delivery at checkout.

---

## Deployment

```
Production stack:
  - Gunicorn behind Nginx
  - PostgreSQL managed DB
  - Redis (Celery broker)
  - WhiteNoise for static files
  - Frontend: Nginx static serve (Vite build)
  - SSL: Let's Encrypt
```

---

*Built with Love for Kenya — Iko Nini TV*