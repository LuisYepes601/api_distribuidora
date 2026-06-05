# API Distribuidora

Pequeña API de clientes usando Express y MongoDB (Mongoose).

Configuración

1. Copia `.env` y ajusta la variable `MONGODB_URI` con tu conexión (local o Atlas).

```
MONGODB_URI=mongodb://localhost:27017/distribuidora
```

2. Instala dependencias:

```bash
npm install
```

3. Inicia el servidor:

```bash
npm start
# o
node server.js
```

Endpoints

- `GET /api/clientes` — listar clientes
- `POST /api/clientes` — crear cliente (body JSON: `name`, `email`, `phone`, `company?`, `address?`, `notes?`, `productType?`, `expectedQuantity?`)
- `PUT /api/clientes/:id` — actualizar cliente por `id`
- `DELETE /api/clientes/:id` — eliminar cliente por `id`

Notas

- El proyecto usa `id` (UUID) como identificador público para mantener compatibilidad con la implementación previa.
- Para despliegue, configura `MONGODB_URI` con la cadena de conexión de tu instancia de MongoDB Atlas o servicio gestionado.
# api_distribuidora
