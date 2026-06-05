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

**Documentación OpenAPI / Swagger**

- Archivo de especificación OpenAPI: `openapi.yaml` (en la raíz del proyecto).
- Para ver la documentación rápidamente puedes usar cualquiera de las siguientes opciones:
	- Abrir `openapi.yaml` en el editor online: https://editor.swagger.io/ (copiar/pegar o subir el archivo).
	- Instalar `swagger-ui-express` y montar la UI en tu servidor (snippet abajo).

Snippet para montar Swagger UI en `server.js` (opcional):

```js
// instalar: npm install swagger-ui-express yamljs
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

Luego abrir `http://localhost:3000/api-docs` para ver la UI de Swagger.

 Si quieres que lo monte yo automáticamente, dime y lo agrego al `server.js` y `package.json`.

Endpoints de Usuarios (documentados en `openapi.yaml`)

- `POST /api/users` — registrar usuario (body: `name`, `email`, `password`)
- `POST /api/users/login` — autenticación (body: `email`, `password`), devuelve `token` si implementas auth
- `GET /api/users/:id` — obtener usuario por id (info pública)

Nota: la spec incluye ejemplos y esquemas `User`, `UserInput`, `LoginInput` y `AuthResponse`. Actualmente el servidor no implementa autenticación — esto es solo documentación. Si quieres que implemente registro/login con JWT, puedo hacerlo.
# api_distribuidora
