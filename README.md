# AI-Driven MSE Onboarding and Strategic Partner Mapping Ecosystem

This repository contains the full source code for the intelligent ecosystem designed to connect Micro and Small Enterprises (MSEs) with Seller Network Participants (SNPs) through advanced AI.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Technology Stack](#technology-stack)
3.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
4.  [Deployment Guide](#deployment-guide)
5.  [Database Migration Guide](#database-migration-guide)
6.  [Monitoring & Logging](#monitoring--logging)
7.  [API Documentation](#api-documentation)

---

## 1. Project Overview

The TEAM platform is a digital public good designed to streamline the integration of MSEs into the national digital commerce network. Key features include:

- **AI-Powered Matching**: A sophisticated algorithm that scores and recommends fulfillment partners based on an MSE's sector, location, and performance.
- **Automated Compliance**: AI-OCR for document verification (Aadhaar, PAN, Udyam) to establish trust and compliance.
- **Multilingual Interface**: Full support for 7 Indian languages with AI-assisted voice input for forms.
- **Secure Transactions**: A real-time transaction ledger with dispute resolution workflows.
- **Robust Governance**: Role-based access control (RBAC), ownership validation, and detailed audit logs for all administrative actions.

## 2. Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, `i18next`
- **Machine Learning**: `transformers` for OCR, `scikit-learn` for matching (simulated).

## 3. Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18.0+
- `virtualenv` (or similar Python environment manager)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r ../docs/requirements.txt
    ```

4.  **Configure Environment:**
    - Copy `.env.example` from the project root to `.env` in the project root.
    - Generate a secure secret key: `python -c "import secrets; print(secrets.token_hex(32))"`
    - Paste the key into `.env`: `JWT_SECRET_KEY=your_generated_key`

5.  **Run the backend server:**
    The application will run on `http://localhost:8000`. The first run will create and seed the `team.db` SQLite database.
    ```bash
    uvicorn main:app --reload
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    The application will be accessible at `http://localhost:5173`.
    ```bash
    npm run dev
    ```

---

## 4. Deployment Guide

This guide provides a high-level overview for a production deployment.

-   **Backend (FastAPI)**:
    -   Use a production-grade ASGI server like **Gunicorn** with Uvicorn workers.
        ```bash
        gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
        ```
    -   **Database**: For production, migrate from SQLite to a robust database like **PostgreSQL** or **MySQL**. Update the `SQLALCHEMY_DATABASE_URL` in `backend/database.py`.
    -   **Environment Variables**: Manage `JWT_SECRET_KEY` and other secrets using a secure system like Doppler, AWS Secrets Manager, or OS environment variables. Do not use `.env` files in production.

-   **Frontend (React/Vite)**:
    -   **Build for production:**
        ```bash
        cd frontend
        npm run build
        ```
    -   **Serve Static Files**: The optimized static files will be generated in the `frontend/dist/` directory. Serve this directory using a web server like **Nginx** or a static hosting service (Vercel, Netlify).
    -   **CORS**: Ensure the `allow_origins` in `backend/main.py` is updated to include your production frontend domain.

## 5. Database Migration Guide

The application uses SQLAlchemy and attempts to perform lightweight "migrations" on startup for development purposes.

-   **Development**: If the database schema (`backend/models.py`) changes, the startup script in `backend/main.py` will attempt to add new columns using `ALTER TABLE`. **This is not a substitute for a real migration tool and is not suitable for production.** If a migration fails or the database gets out of sync, the safest approach is to **delete the `team.db` file** and restart the backend to recreate it from scratch.

-   **Production**: For production environments, it is **highly recommended** to integrate a dedicated migration tool like **Alembic**.
    1.  **Initialize Alembic**: `alembic init alembic`
    2.  **Configure `alembic.ini`**: Point `sqlalchemy.url` to your production database.
    3.  **Auto-generate Migrations**: `alembic revision --autogenerate -m "Add user_id to mse table"`
    4.  **Apply Migrations**: `alembic upgrade head`

## 6. Monitoring & Logging

-   **Backend**: The application uses Python's built-in `logging` module. In a production environment, this should be configured to output structured JSON logs (e.g., using `python-json-logger`) and forwarded to a log aggregation service like Datadog, ELK Stack, or Splunk.
    -   **Key Logs**:
        -   `SystemAuditLog`: All sensitive user and admin actions are recorded in the `system_audit_log` table. This should be monitored for suspicious activity.
        -   `LOGIN_FAILED` and `LOGIN_SUCCESS` events provide security insights.
        -   `ADMIN_DELETE_*` and `ADMIN_VERIFY_*` actions provide an audit trail for privileged operations.

-   **Frontend**: Client-side errors are caught by the Axios interceptor. For production, integrate an error tracking service like Sentry or Bugsnag by dispatching events to their SDKs from within the interceptor in `frontend/src/config.ts`.

## 7. API Documentation

The full OpenAPI 3.0 specification is programmatically generated and available at `docs/openapi_spec.json`.

You can also access the interactive API documentation (Swagger UI) provided by FastAPI by running the backend server and navigating to `http://localhost:8000/docs`.
