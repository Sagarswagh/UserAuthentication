# User Authentication Service — Campus Event Management System (CEMS)

This repository implements the **User Authentication Service** for the Campus Event Management System (CEMS).  
It provides secure user registration, login, role assignment, password hashing, and JWT-based authentication.  
A React-based frontend UI is included to allow instructors and testers to easily interact with and validate the authentication workflow.

Although CEMS contains several microservices (Event Creation, Booking, Notification), this repository contains **only the Authentication Service and its UI**.  
These other services communicate with this one through REST APIs to validate identity and retrieve user roles.

---

## 📚 Table of Contents

1. Overview  
2. How This Service Fits in CEMS  
3. Tech Stack  
4. Project Structure  
5. Prerequisites  
6. Environment Variables  
7. Running the Project  
8. Database Setup  
9. API Endpoints  
10. UI Usage (Professor Replication Guide)  
11. Troubleshooting  
12. Security Notes  
13. Recommended Improvements  

---

## 🧩 Overview

This service is responsible for:

- Creating new user accounts  
- Validating user credentials at login  
- Hashing passwords via **bcrypt**  
- Generating **JWT tokens**  
- Assigning roles (STUDENT, ORGANIZER, ADMIN)  
- Providing a React-based UI for testing authentication  

---

## 🔗 How This Service Fits in CEMS

Other CEMS microservices use this Authentication Service to:

- Verify user identity before bookings  
- Validate organizer role before event creation  
- Retrieve user details for sending notifications  

This repo contains ONLY authentication + UI. The other services consume its REST endpoints.

---

## 🛠 Tech Stack

### Backend
- Python 3.10+  
- FastAPI  
- SQLAlchemy ORM  
- PostgreSQL  
- bcrypt  
- JWT (PyJWT)  

### Frontend
- React (Vite)  
- Axios  

---

## 📁 Project Structure

```
UserAuthentication/
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── utils/
│   ├── database.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── run.sh
└── README.md
```

---

## 🧰 Prerequisites

- Python 3.10+  
- Node.js 18+ or 20+  
- PostgreSQL  
- Git  

---

## 🔐 Environment Variables

Create:

`backend/.env`

```
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=postgresql+asyncpg://<USER>:<PASS>@<HOST>:5432/<DB_NAME>
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BCRYPT_WORK_FACTOR=12
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🚀 Running the Project

### ⭐ Quick Start

```
chmod +x run.sh
./run.sh
```

---

### Backend Setup

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

## 🗄 Database Setup

```
CREATE DATABASE cems_auth;
CREATE USER cems_user WITH ENCRYPTED PASSWORD 'StrongPassword123';
GRANT ALL PRIVILEGES ON DATABASE cems_auth TO cems_user;
```

Set:

```
DATABASE_URL=postgresql+asyncpg://cems_user:StrongPassword123@localhost:5432/cems_auth
```

---

## 📡 API Endpoints

### POST `/api/users/register`

```
{
  "email": "student@example.edu",
  "password": "Test1234!",
  "username": "student01",
  "role": "STUDENT"
}
```

### POST `/api/users/login`

```
{
  "email": "student@example.edu",
  "password": "Test1234!"
}
```

Response contains JWT.

---

## 🧑‍🏫 UI Usage (Professor Replication Guide)

1. Start backend  
2. Start frontend  
3. Open `http://localhost:5173`  
4. Register a Student and Organizer  
5. Login with each  
6. UI stores JWT and shows authenticated state  

---

## 🛑 Troubleshooting

- CORS error → check ALLOWED_ORIGINS  
- DB error → verify DATABASE_URL  
- JWT error → ensure JWT_SECRET_KEY is set  

---

## 🔒 Security Notes

- Never commit `.env`  
- Use strong JWT secrets  
- Use HTTPS in production  

---

## 🚧 Recommended Improvements

- Add Docker Compose  
- Add Alembic migrations  
- Add pytest unit tests  
- Add RBAC middleware  

