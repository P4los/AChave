# 🔐 AChave - Password Manager

Una bóveda de contraseñas moderna, segura y de código abierto. **AChave** es un gestor de contraseñas con cifrado cliente-servidor que permite almacenar y gestionar tus contraseñas de forma segura con interfaces web, desktop y extensión de navegador.

Desarrollado por **Miguel Garcia**, **Ou Zhang** y **Borja Barroso** durante el **HackUDC 2026**.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Guía de Instalación](#guía-de-instalación)
- [**Guía Self-Hosted**](#-guía-self-hosted-autoalojado)
- [Uso del Proyecto](#uso-del-proyecto)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Sistema de Encriptación](#sistema-de-encriptación)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## ✨ Características

- 🔐 **Cifrado End-to-End**: Las contraseñas se cifran en el cliente con criptografía RSA + AES
- 👤 **Autenticación Multi-fase**: Registro → Verificación email → Setup Master Password
- 🗂️ **Múltiples Bóvedas**: Organiza tus contraseñas en diferentes cofres temáticos
- 📱 **Multiplataforma**: Web (Next.js), Frontend Dashboard y Extensión Chrome
- 🔍 **Validación de Seguridad**: Integración con API de contraseñas comprometidas (HaveIBeenPwned)
- ⚡ **Generador de Contraseñas**: Genera contraseñas seguras y personalizadas
- 🎨 **Interfaz Moderna**: UI oscura/clara con TailwindCSS
- 🚀 **Despliegue Containerizado**: Docker Compose para ejecución local completa

---

## 🏗️ Arquitectura

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        A1["Pages<br/>(Login, Dashboard, Claves)"]
        A2["Components<br/>(Modals, Layout, Forms)"]
        A3["Crypto Context<br/>(Manejo de llaves)"]
        A4["Hooks<br/>(API, Encrypt, Validate)"]
    end

    subgraph Extension["Chrome Extension<br/>(Vite + React)"]
        B1["React Components"]
        B2["Content Script"]
        B3["Background Script"]
        B4["Storage API"]
    end

    subgraph Backend["Backend (FastAPI)"]
        C1["Routers<br/>(Auth, Passwords, Vaults)"]
        C2["CRUD Operations<br/>(User, Password, Vault)"]
        C3["Security Utils<br/>(JWT, Bcrypt, Crypto)"]
        C4["Email Service<br/>(Verification, Notifications)"]
    end

    subgraph Database["Database (PostgreSQL)"]
        D1["Users Table"]
        D2["Vaults Table"]
        D3["Passwords Table"]
    end

    A1 --> A3
    A1 --> A4
    A2 --> A3
    B1 --> B4
    B2 --> B4
    B3 --> B4
    A4 -.->|HTTP Requests| C1
    B4 -.->|HTTP Requests| C1
    C1 --> C2
    C1 --> C3
    C1 --> C4
    C2 --> Database
```

---

## 📦 Componentes Principales

### **Backend (FastAPI)**

- **Lenguaje**: Python 3.10+
- **Framework**: FastAPI
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (HS256)
- **Encriptación**: Bcrypt, RSA, AES

### **Frontend (Next.js)**

- **Lenguaje**: TypeScript / React 19
- **Estilos**: TailwindCSS
- **Encriptación**: node-forge
- **Estado**: React Context

### **Extensión Chrome (Vite)**

- **Lenguaje**: TypeScript / React
- **Build Tool**: Vite
- **APIs**: chrome.storage, chrome.tabs

---

## 🚀 Guía de Instalación

### Requisitos Previos

- **Docker & Docker Compose** (recomendado para fácil setup)
- **O alternativamente**:
  - Python 3.10+
  - Node.js 18+
  - PostgreSQL 15+

### Opción 1: Con Docker Compose (⭐ Recomendado)

1. **Clonar el repositorio**:

   ```bash
   git clone https://github.com/tu-usuario/AChave.git
   cd AChave
   ```

2. **Configurar variables de entorno**:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Editar `backend/.env`** con tus valores:

   ```env
   DATABASE_URL=postgresql://postgres@db:5432/achave_db
   JWT_SECRET_KEY=tu-clave-secreta-super-segura-change-this
   SMTP_USER=tu-usuario-brevo@gmail.com
   SMTP_PASSWORD=tu-api-key-brevo
   SMTP_FROM_EMAIL=noreply@achave.com
   FRONTEND_URL=http://localhost:3000
   ```

4. **Iniciar con Docker Compose**:

   ```bash
   docker-compose up --build
   ```

   Esto levantará:
   - **PostgreSQL** en `localhost:5432`
   - **Backend** en `http://localhost:8000`
   - **Frontend** en `http://localhost:3000`

5. **Acceder a la aplicación**:
   - Frontend: http://localhost:3000
   - API Docs (Swagger): http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

---

### Opción 2: Instalación Manual (Sin Docker)

#### Backend

1. **Navegar a la carpeta backend**:

   ```bash
   cd backend
   ```

2. **Crear entorno virtual**:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   ```

3. **Instalar dependencias**:

   ```bash
   pip install -e .
   ```

4. **Crear base de datos PostgreSQL**:

   ```bash
   createdb achave_db
   ```

5. **Configurar variables de entorno**:

   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

6. **Iniciar el servidor**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend

1. **Navegar a la carpeta frontend**:

   ```bash
   cd frontend
   ```

2. **Instalar dependencias**:

   ```bash
   npm install
   ```

3. **Crear archivo `.env.local`**:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Iniciar servidor de desarrollo**:

   ```bash
   npm run dev
   ```

   Accesible en: http://localhost:3000

#### Extensión Chrome

1. **Navegar a la carpeta extension**:

   ```bash
   cd extension
   ```

2. **Instalar dependencias**:

   ```bash
   npm install
   ```

3. **Build de la extensión**:

   ```bash
   npm run build
   ```

4. **Cargar en Chrome**:
   - Abrir `chrome://extensions/`
   - Activar "Modo de desarrollador"
   - Click en "Cargar extensión sin empaquetar"
   - Seleccionar la carpeta `extension/dist/`

---

## 🏠 Guía Self-Hosted (Autoalojado)

AChave incluye un modo **self-hosted** diseñado para que puedas alojar tu propia instancia en tu servidor personal, NAS, Raspberry Pi o cualquier máquina con Docker. En este modo **no se requiere verificación por email** — el registro es inmediato.

### ⚡ Arranque Rápido (1 comando)

```bash
git clone https://github.com/tu-usuario/AChave.git
cd AChave
./start.sh
```

Eso es todo. El script:
- ✅ Verifica que Docker está instalado
- ✅ Crea `backend/.env` automáticamente con una clave JWT aleatoria segura
- ✅ Crea `frontend/.env.local` con la URL del backend
- ✅ Levanta PostgreSQL + Backend + Frontend + Adminer

### 📍 URLs de Acceso

| Servicio | URL |
|----------|-----|
| 🌐 Frontend (Dashboard) | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000 |
| 📚 Swagger Docs | http://localhost:8000/docs |
| 🗄️ Adminer (Base de datos) | http://localhost:8080 |

### 🛠️ Comandos del Script

```bash
./start.sh              # Levantar todos los servicios (por defecto)
./start.sh stop          # Parar todo
./start.sh restart       # Reiniciar (útil tras cambios de código)
./start.sh logs          # Ver logs en tiempo real
./start.sh status        # Ver estado de los contenedores
./start.sh reset-db      # ⚠️ Borrar y recrear la base de datos
```

### 🔧 Configuración

#### Variables del Backend (`backend/.env`)

```env
JWT_SECRET_KEY=tu_clave_secreta       # Se genera automáticamente en el primer arranque
JWT_EXPIRE_MINUTES=60                 # Duración de la sesión en minutos
FRONTEND_URL=http://localhost:3000    # URL del frontend
```

> 💡 **Nota:** No se necesitan variables SMTP — el modo self-hosted no envía emails.

#### Variables del Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 🌐 Acceder desde Otro Ordenador (Red Local)

Si quieres acceder a AChave desde otro dispositivo de tu red:

1. **Averigua la IP de tu servidor**:
   ```bash
   hostname -I
   # Ejemplo: 192.168.1.50
   ```

2. **Edita `frontend/.env.local`**:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.50:8000
   ```

3. **Edita `docker-compose.yml`** (o pasa la variable como entorno):
   ```bash
   NEXT_PUBLIC_API_URL=http://192.168.1.50:8000 ./start.sh restart
   ```

4. **Desde el otro ordenador**, abre: `http://192.168.1.50:3000`

### 🧩 Extensión del Navegador (Self-Hosted)

La extensión de Chrome también funciona con tu servidor self-hosted:

1. **Compila la extensión**:
   ```bash
   cd extension
   npm install
   npm run build
   ```

2. **Carga en Chrome**: `chrome://extensions` → Modo desarrollador → Cargar descomprimida → selecciona `extension/dist/`

3. **Configura tu servidor en la extensión**:
   - Abre la extensión → pestaña **Ajustes**
   - En la sección **Servidor**, escribe la URL de tu backend (ej: `http://192.168.1.50:8000`)
   - Click en **"Probar y guardar"**
   - La extensión verificará la conexión antes de guardar

### 🔐 Flujo de Registro (Self-Hosted)

A diferencia de la versión cloud, el registro self-hosted es **instantáneo**:

```
1. Introduces email + Master Password
2. El frontend genera un par de llaves RSA (2048-bit) en tu navegador
3. Se cifra la llave privada con tu Master Password (AES-256-GCM)
4. Se envía todo al backend → usuario creado + cofre por defecto
5. Recibes un JWT → acceso inmediato al dashboard
```

> ⚠️ **IMPORTANTE:** La Master Password es **irrecuperable**. Si la olvidas, no hay forma de acceder a tus contraseñas. No existe verificación por email ni método de recuperación.

### 🛡️ Seguridad en Self-Hosted

| Característica | Estado |
|---|---|
| Cifrado Zero-Knowledge | ✅ Las contraseñas se cifran en tu navegador |
| Master Password | ✅ Solo se envía el hash bcrypt al servidor |
| Llaves RSA en memoria | ✅ La clave privada no se guarda en disco |
| Sin email | ✅ Sin dependencias externas de SMTP |
| Sesiones efímeras | ✅ Al recargar la página, debes re-introducir tu Master Password |

## 📖 Uso del Proyecto

### Flujo de Usuario

1. **Registro**: El usuario ingresa su email
2. **Verificación**: Se envía un email de confirmación
3. **Setup Master Password**: Después de verificar, configura su Master Password
4. **Dashboard**: Acceso a bóvedas y contraseñas
5. **Gestión**: Crear, editar, eliminar contraseñas y bóvedas

### Comandos Útiles

```bash
# Backend - Reset completo de la base de datos
python reset_db.py

# Frontend - Build para producción
npm run build

# Extension - Build optimizado
npm run build

# Todos - Activar en modo desarrollo con Docker
docker-compose up -d
docker-compose logs -f
```

---

## 🔐 Flujo de Autenticación

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant Email

    User->>Frontend: 1. Ingresa email
    Frontend->>Backend: POST /auth/register
    Backend->>Database: Crear usuario (is_verified=false)
    Backend->>Email: Enviar token de verificación
    Email-->>User: Link de verificación

    User->>Frontend: 2. Click link de verificación
    Frontend->>Backend: GET /auth/verify/{token}
    Backend->>Database: Marcar usuario como verified
    Backend-->>Frontend: JWT temporal

    User->>Frontend: 3. Configura Master Password + Keys
    Frontend->>Frontend: Genera par de llaves RSA
    Frontend->>Frontend: Cifra Master Password
    Frontend->>Backend: POST /auth/setup-crypto
    Backend->>Database: Hashear y guardar Master Password
    Backend->>Database: Guardar llave pública y privada cifrada
    Backend-->>Frontend: Usuario completamente setup

    User->>Frontend: 4. Login
    Frontend->>Backend: POST /auth/login (email + password)
    Backend->>Database: Verificar credenciales con bcrypt
    Backend->>Frontend: JWT + Paquete criptográfico
    Frontend->>Frontend: Descargar llaves privadas en memoria
    Frontend-->>User: ✅ Sesión iniciada
```

---

## 🔒 Sistema de Encriptación

AChave implementa un modelo **híbrido de encriptación** para máxima seguridad:

### Componentes del Sistema

#### 1. **Master Password** 🔑

- Contraseña principal del usuario
- **Almacenada en backend**: Hash bcrypt con salt (rounds=12)
- **Usada en cliente**: Clave de derivación para cifrar la llave privada RSA
- **Algoritmo**: Bcrypt HS256

#### 2. **Par de Llaves RSA** 🔓

- **Generadas en cliente** durante setup (2048 bits)
- **Llave Pública**: Almacenada en texto plano en la BD
- **Llave Privada**: Cifrada con AES usando la Master Password
- **Uso**: Firma digital y validación de contraseñas

#### 3. **Validador Cifrado** ✅

- Es `AES("SESAMO_ABIERTO", Master Password)`
- **Propósito**: Validar que la Master Password introducida en login es correcta
- **Ventaja**: No expone la contraseña en el servidor (zero-knowledge proof)

#### 4. **Contraseñas de Sitios Web** 🌐

- **Cifradas en cliente** con AES-256-GCM
- **Capa adicional**: RSA encryption + AES encryption
- **Almacenadas en BD**: Como ciphertext opaco
- **Descifrado**: Solo en cliente con llaves privadas desencriptadas

### Flujo de Cifrado Completo

```mermaid
graph LR
    A["Master Password<br/>(Usuario ingresa)"]
    B["Validador Cifrado<br/>AES SESAMO ABIERTO"]
    C["Derivación de Clave"]
    D["RSA 2048 Keys"]
    E["Llave Privada<br/>Cifrada con AES"]
    F["Contrasena Web"]
    G["Cifra con AES"]
    H["Base de Datos<br/>(ciphertext)"]

    A --> B
    B -.->|Validación| A
    A --> C
    C --> D
    D --> E
    E -->|Desencripta en cliente| D
    F --> G
    D --> G
    G --> H

    style B fill:#ff6b6b
    style E fill:#4ecdc4
    style H fill:#95e1d3
```

### Ejemplo de Flujo Post-Login

```
1. Usuario ingresa: email + Master Password
2. Backend valida credenciales con bcrypt
3. Backend devuelve:
   - JWT (para peticiones autenticadas)
   - validador_cifrado (AES)
   - llave_privada_cifrada (RSA privada, AES)
   - llave_publica (RSA pública)

4. Frontend recibe todo y:
   - Desencripta validador_cifrado con Master Password
   - Verifica que el resultado sea "SESAMO_ABIERTO" ✓
   - Desencripta llave_privada_cifrada con Master Password
   - Guarda llaves en localStorage/sessionStorage
   - Puede ahora decifrar contraseñas almacenadas

5. Cuando usuario solicita contraseña:
   - Frontend envía petición a GET /passwords/{id}
   - Backend devuelve ciphertext cifrado
   - Frontend desencripta con RSA privada + AES
   - Muestra contraseña al usuario
```

### ¿Por qué este modelo es seguro?

| Aspecto             | Garantía                                    |
| ------------------- | ------------------------------------------- |
| **Master Password** | Never sent to server (only hash) ✅         |
| **Private Key**     | Protected by Master Password + AES ✅       |
| **Passwords**       | Encrypted with RSA + AES, opaque in DB ✅   |
| **Validation**      | Zero-knowledge proof (validador cifrado) ✅ |
| **Token Hijacking** | Sin llave privada, token es inútil ✅       |

---

## 🗄️ Base de Datos

### Diagrama ER

```mermaid
erDiagram
    USERS ||--o{ VAULTS : owns
    VAULTS ||--o{ PASSWORDS : contains

    USERS {
        uuid user_id PK
        string email UK
        string hashed_password
        boolean is_verified
        text validador_cifrado
        text llave_publica
        text llave_privada_cifrada
        string token_type
        text access_token
        timestamp timestamp
    }

    VAULTS {
        uuid vault_id PK
        string name
        string description
        string icon
        string color
        boolean is_default
        uuid user_id FK
        timestamp timestamp
    }

    PASSWORDS {
        uuid passwords_id PK
        string web
        string user_email
        text password
        boolean compromised
        uuid vault_id FK
    }
```

### Tablas Principales

#### **USERS**

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),  -- Bcrypt hash
    is_verified BOOLEAN DEFAULT FALSE,
    validador_cifrado TEXT,         -- AES("SESAMO_ABIERTO", master_pwd)
    llave_publica TEXT,             -- RSA public key
    llave_privada_cifrada TEXT,     -- AES(RSA private key, master_pwd)
    token_type VARCHAR(50),
    access_token TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **VAULTS**

```sql
CREATE TABLE vaults (
    vault_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(255),
    color VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **PASSWORDS**

```sql
CREATE TABLE passwords (
    passwords_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES vaults(vault_id) ON DELETE CASCADE,
    web VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,         -- AES encrypted ciphertext
    compromised BOOLEAN DEFAULT FALSE
);
```

---

## 📡 API Endpoints

### Autenticación

| Método | Endpoint               | Descripción                           |
| ------ | ---------------------- | ------------------------------------- |
| `POST` | `/auth/register`       | Registrar usuario (fase 1)            |
| `GET`  | `/auth/verify/{token}` | Verificar email (fase 2)              |
| `POST` | `/auth/setup-crypto`   | Setup Master Password + Keys (fase 3) |
| `POST` | `/auth/login`          | Login con email + password            |
| `GET`  | `/auth/me`             | Obtener perfil usuario                |
| `POST` | `/auth/logout`         | Cerrar sesión                         |

### Bóvedas

| Método   | Endpoint             | Descripción                |
| -------- | -------------------- | -------------------------- |
| `GET`    | `/vaults/`           | Listar bóvedas del usuario |
| `POST`   | `/vaults/`           | Crear nueva bóveda         |
| `GET`    | `/vaults/{vault_id}` | Obtener detalles de bóveda |
| `PUT`    | `/vaults/{vault_id}` | Actualizar bóveda          |
| `DELETE` | `/vaults/{vault_id}` | Eliminar bóveda            |

### Contraseñas

| Método   | Endpoint                            | Descripción                    |
| -------- | ----------------------------------- | ------------------------------ |
| `GET`    | `/passwords/vault/{vault_id}`       | Listar contraseñas de bóveda   |
| `POST`   | `/passwords/`                       | Crear contraseña               |
| `GET`    | `/passwords/{password_id}`          | Obtener detalles de contraseña |
| `PUT`    | `/passwords/{password_id}`          | Actualizar contraseña          |
| `DELETE` | `/passwords/{password_id}`          | Eliminar contraseña            |
| `GET`    | `/passwords/check-pwned/{password}` | Validar vs HaveIBeenPwned      |

#### 🔐 Validación de Contraseñas Comprometidas

AChave integra la **API de Have I Been Pwned (HIBP)** para comparar las contraseñas guardadas y alertar al usuario si una contraseña ha sido comprometida en brechas de seguridad conocidas. El campo `compromised` se marca como `true` si la contraseña se encuentra en la base de datos de HIBP.

### Ejemplo de Petición Autenticada

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MasterPassword123"}'

# Respuesta
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "validador_cifrado": "...",
  "llave_privada_cifrada": "..."
}

# Usar token
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📁 Estructura del Proyecto

```
AChave/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Punto de entrada
│   ├── config.py              # Configuración (env vars)
│   ├── database.py            # Conexión PostgreSQL
│   ├── requirements.txt        # Dependencias Python
│   ├── pyproject.toml          # Setup del proyecto
│   ├── Dockerfile             # Docker para backend
│   ├── models/                # ORM Models (SQLAlchemy)
│   │   ├── user.py
│   │   ├── vault.py
│   │   └── password.py
│   ├── schemas/               # Pydantic Schemas (validación)
│   │   ├── user.py
│   │   ├── vault.py
│   │   └── password.py
│   ├── crud/                  # Database operations
│   │   ├── user.py
│   │   ├── vault.py
│   │   └── password.py
│   ├── routers/               # API Endpoints
│   │   ├── auth.py
│   │   ├── vaults.py
│   │   └── password.py
│   └── utils/                 # Utilidades
│       ├── security.py        # JWT, bcrypt, crypto
│       ├── email.py           # SMTP (Brevo)
│       ├── oauth.py           # OAuth (futuro)
│       └── hash_check.py      # HaveIBeenPwned
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router (pages)
│   │   │   ├── page.tsx       # Home
│   │   │   ├── login/         # Login page
│   │   │   ├── verify/        # Email verification
│   │   │   └── (dashboard)/   # Protected routes
│   │   ├── components/        # React Components
│   │   │   ├── layout/        # Layout components
│   │   │   └── modals/        # Modal dialogs
│   │   ├── context/           # React Context
│   │   │   ├── CryptoContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilidades
│   │   │   └── api.ts         # API cliente
│   │   └── middleware.ts      # NextAuth middleware
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── extension/                  # Chrome Extension
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/        # React components
│   │   ├── pages/             # Extension pages
│   │   ├── context/           # Crypto context
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/
│   │       ├── api.ts         # API calls
│   │       └── storage.ts     # chrome.storage API
│   ├── public/
│   │   ├── background.js      # Service worker
│   │   ├── content.js         # Content script
│   │   └── icons/             # Extension icons
│   ├── manifest.json          # Extension manifest
│   └── vite.config.ts         # Vite config
│
├── docker-compose.yml         # Orquestación de servicios
├── README.md                  # Este archivo
└── LICENSE                    # Licencia
```

---

## ️ Troubleshooting

### Problema: "Database connection refused"

**Solución**: Asegurate de que PostgreSQL está corriendo:

```bash
# Con Docker Compose
docker-compose ps

# O iniciar si está parado
docker-compose up db -d
```

### Problema: "CORS error en frontend"

**Solución**: Verifica que el backend tiene CORS enabled y puertos correctos en `main.py`:

```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Problema: "JWT token inválido"

**Solución**: Asegurate de cambiar `JWT_SECRET_KEY` en `.env` y que es diferente entre registros:

```bash
# Generar nueva clave
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Problema: "Email de verificación no recibido"

**Solución**: Configura credenciales SMTP en `.env`:

```env
SMTP_USER=tu-usuario@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM_EMAIL=noreply@tu-dominio.com
```

---

## 📚 Tecnologías Utilizadas

| Capa          | Tecnología           | Versión |
| ------------- | -------------------- | ------- |
| **Backend**   | FastAPI              | 0.104+  |
| **ORM**       | SQLAlchemy           | 2.0+    |
| **BD**        | PostgreSQL           | 15+     |
| **Auth**      | JWT (PyJWT)          | 2.8+    |
| **Crypto**    | bcrypt, cryptography | Latest  |
| **Frontend**  | Next.js              | 16.1+   |
| **React**     | React                | 19+     |
| **Estilos**   | TailwindCSS          | 4+      |
| **Crypto JS** | node-forge           | 1.3+    |
| **Extension** | Vite                 | 7+      |

---

## 🚀 Deployment

### Deploy en Producción (Recomendado: Digital Ocean / Heroku)

1. **Variables de entorno en producción**:

   ```env
   JWT_SECRET_KEY=super-clave-segura-generada
   DATABASE_URL=postgresql://user:pass@prod-db.com/achave
   FRONTEND_URL=https://tu-dominio.com
   SMTP_USER=no-reply@tu-dominio.com
   # ...más vars
   ```

2. **Build de Docker para producción**:

   ```bash
   docker build -t achave:latest .
   docker push tu-registry/achave:latest
   ```

3. **Configurar base de datos remota** (managed PostgreSQL)

4. **Enviar variables de entorno a plataforma de deployment**

5. **Deployar con docker-compose o Kubernetes**

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT** - ver archivo [LICENSE](LICENSE) para detalles.

---

## 👥 Autores

- **Miguel Garcia** - Frontend & UI
- **Ou Zhang** - Backend
- **Borja Barroso** - Backend

Desarrollado durante **HackUDC 2026** 🏆

---

## 🔒 Security Policy

AChave es una bóveda de contraseñas, por lo que la seguridad es prioritaria:

- ✅ Todas las contraseñas se cifran cliente-side antes de enviar al servidor
- ✅ Master Password nunca se transmite al backend (solo hash)
- ✅ Llave privada está protegida con AES
- ✅ Validación con API de contraseñas comprometidas
- ⚠️ No somos responsables de pérdida de Master Password (es irrecuperable)

---

**Última actualización**: Marzo 2026 | v0.1.0
