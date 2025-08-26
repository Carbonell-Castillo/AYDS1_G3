# Manual Técnico del EasyPark

| **Nombres** | **Carnet**|
|-------------|-----------|
| Walter Josue De La Cruz Lopez | 200312973 |
| Bruce Carbonell Castillo Cifuentes | 202203069 |
| Luis Pedro Pérez Monzón | 201901271 |

## Índice

- [1. Introducción](#introducción)
- [2. Arquitectura General](#arquitectura-general)
- [3. Backend](#backend)
  - [3.1. Estructura de Carpetas](#estructura-de-carpetas-backend)
  - [3.2. Instalación y Configuración](#instalación-y-configuración-backend)
  - [3.3. Endpoints Principales](#endpoints-principales-backend)
  - [3.4. Ejemplo de Consumo](#ejemplo-de-consumo-backend)
- [4. Frontend](#frontend)
  - [4.1. Estructura de Carpetas](#estructura-de-carpetas-frontend)
  - [4.2. Instalación y Configuración](#instalación-y-configuración-frontend)
  - [4.3. Consumo de la API](#consumo-de-la-api-frontend)
  - [4.4. Ejemplo de Petición](#ejemplo-de-petición-frontend)
- [5. Recomendaciones de Seguridad](#recomendaciones-de-seguridad)
- [6. Contacto y Soporte](#contacto-y-soporte)

---

## 1. Introducción

Este manual técnico describe la arquitectura, instalación, configuración y uso del sistema AYDS1_G3, el cual gestiona usuarios, parqueos, multas y reportes. El sistema está compuesto por un backend en Node.js/Express y un frontend que puede consumir la API REST.

---

## 2. Arquitectura General

El sistema sigue una arquitectura cliente-servidor.  
- **Backend:** expone una API RESTful para la gestión de datos.
- **Frontend:** consume la API para mostrar información y permitir la interacción del usuario.

---

## 3. Backend

### 3.1. Estructura de Carpetas (Backend)

```
backend/
├── src/
│   ├── common/                # Funciones genéricas y utilidades
│   ├── modules/
│   │   ├── users/             # Lógica y rutas de usuarios
│   │   ├── parqueo/           # Lógica y rutas de parqueos
│   │   ├── multas/            # Lógica y rutas de multas
│   │   ├── reportes/          # Lógica y rutas de reportes
│   ├── app.js                 # Configuración principal de Express
│   ├── config.js              # Configuración de la base de datos y app
```

### 3.2. Instalación y Configuración (Backend)

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar el archivo `.env` con los datos de la base de datos.
4. Iniciar el servidor:
   ```bash
   npm start
   ```

### 3.3. Endpoints Principales (Backend)

- **Usuarios**
  - `GET /api/usuarios/`  
    Lista todos los usuarios.
  - `POST /api/usuarios/auth/login`  
    Autenticación de usuario.
  - `POST /api/usuarios/`  
    Crear usuario.
  - `GET /api/usuarios/:dpi/vehiculos`  
    Vehículos de un usuario.

- **Parqueo**
  - `GET /api/parqueo/espacios-disponibles`  
    Consulta espacios libres.
  - `POST /api/parqueo/asignar-automatico`  
    Asignación automática de parqueo.

- **Multas**
  - `GET /api/multas/:usuario`  
    Multas de un usuario.

- **Reportes**
  - `GET /api/reportes/ocupacion?periodo=diario`  
    Ocupación de parqueos por periodo.

### 3.4. Ejemplo de Consumo (Backend)

```bash
curl -X GET "http://localhost:3000/api/reportes/ocupacion?periodo=diario"
```

Respuesta esperada:
```json
{
  "periodo": "2025-08-14",
  "ocupacion": [
    { "hora": "08:00", "espaciosOcupados": 25 },
    { "hora": "09:00", "espaciosOcupados": 40 }
  ]
}
```

### 3.5 Diagrama Entidad - Relación de la Base de Datos
![alt text](<Imagenes/Diagrama ER.jpg>)

---

## 4. Frontend

### 4.1. Estructura de Carpetas (Frontend)

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── pages/             # Vistas principales
│   ├── services/          # Consumo de la API
│   ├── App.js             # Componente principal
│   ├── index.js           # Entrada de la aplicación
```

### 4.2. Instalación y Configuración (Frontend)

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar la URL base de la API en los servicios.
4. Iniciar la aplicación:
   ```bash
   npm start
   ```

### 4.3. Consumo de la API (Frontend)

Utiliza librerías como `axios` o `fetch` para consumir los endpoints del backend.

#### Ejemplo con Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export async function getOcupacion(periodo) {
  const response = await axios.get(`${API_URL}/reportes/ocupacion?periodo=${periodo}`);
  return response.data;
}
```

### 4.4. Ejemplo de Petición (Frontend)

```javascript
// En un componente React
useEffect(() => {
  getOcupacion('diario').then(data => {
    setOcupacion(data.ocupacion);
  });
}, []);
```

---