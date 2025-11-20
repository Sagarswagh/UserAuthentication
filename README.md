# User Authentication Service

This service handles user registration and authentication for the Campus Event Management System (CEMS). It provides secure access control for two distinct user roles: **Students** and **Organizers**.

## Technology Stack

*   **Backend Framework**: FastAPI (Python) - High-performance, easy-to-use web framework.
*   **Database**: PostgreSQL (hosted on NeonDB) - Robust relational database for storing user data.
*   **ORM**: SQLAlchemy - For interacting with the database using Python objects.
*   **Authentication**:
    *   **JWT (JSON Web Tokens)**: For stateless, secure API authentication.
    *   **Bcrypt**: For secure password hashing.
*   **Frontend**: React (Vite) - Modern frontend build tool and library.

## Key Features

1.  **User Registration**:
    *   Allows users to sign up as either a Student or an Organizer.
    *   Captures essential details: Email, Phone, Address, and Password.
    *   Validates email uniqueness.

2.  **Secure Login**:
    *   Authenticates users using Email and Password.
    *   Verifies the user's role matches the requested role.
    *   Returns a JWT access token upon successful login.
    *   Returns User ID, Username, and Role for frontend session management.

3.  **Role-Based Access Control**:
    *   Distinguishes between Student and Organizer permissions (enforced via token claims and logic).

4.  **Security Best Practices**:
    *   Passwords are never stored in plain text; they are hashed using Bcrypt.
    *   Environment variables (like Database URL and Secret Keys) are managed via `.env` files for security.
    *   CORS (Cross-Origin Resource Sharing) enabled for frontend communication.

## Database Schema

The service uses two main tables:
*   `users`: Stores profile information (UUID, username/email, phone, address).
*   `user_credentials`: Stores authentication data (password hash, role) linked to the user via UUID.

## API Endpoints

*   `POST /api/users/register`: Register a new user.
*   `POST /api/users/login`: Authenticate a user and receive a token.
