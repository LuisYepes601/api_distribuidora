const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
let swaggerDocument;
try {
    swaggerDocument = YAML.load('./openapi.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.warn('No se pudo cargar openapi.yaml para Swagger UI:', e.message || e);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/distribuidora';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch(err => {
    console.error('Error conectando a MongoDB:', err.message || err);
    // No hacemos exit para permitir que la UI de Swagger esté disponible mientras depuras
});

// Iniciar servidor inmediatamente para que /api-docs esté disponible incluso si DB falla
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    if (swaggerDocument) console.log(`Docs en: http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Puerto ${PORT} en uso. Cierra el proceso que lo usa o cambia PORT.`);
        process.exit(1);
    } else {
        console.error('Error en el servidor:', err);
    }
});

const clienteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, default: () => uuidv4() },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    productType: { type: String, default: 'Garrafón' },
    expectedQuantity: { type: Number, default: 1 }
}, { timestamps: true });

const Cliente = mongoose.model('Cliente', clienteSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Endpoints
app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find().lean();
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

//
app.get('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const cliente = await Cliente.findOne({ id }).lean();
        if (!cliente) return res.status(404).json({ error: 'No encontrado' });
        res.json(cliente);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

app.get('/api/clientes/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query "q" es requerido' });
    try {
        const regex = new RegExp(q, 'i');
        const clientes = await Cliente.find({
            $or: [
                { name: regex },
                { email: regex },
                { phone: regex },
                { company: regex }
            ]
        }).lean();
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: 'Error al buscar clientes' });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { name, email, phone, company, address,
            notes, productType, expectedQuantity } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Nombre, email y teléfono son obligatorios' });
        }
        const nuevo = new Cliente(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Cliente con ese id ya existe' });
        }
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await Cliente.findOneAndUpdate({ id }, { ...req.body, id }, { new: true });
        if (!updated) return res.status(404).json({ error: 'No encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Cliente.findOneAndDelete({ id });
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});


app.delete('/api/clientes', async (req, res) => {
    try {
        await Cliente.deleteMany({});
        res.json({ message: 'Todos los clientes eliminados' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar clientes' });
    }
});


// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nCerrando servidor...');
    try {
        await mongoose.disconnect();
    } catch (e) { }
    process.exit(0);
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y password son requeridos' });
    }
    User.findOne({ username, password }).lean().then(user => {
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        res.json({ message: 'Login exitoso' });
    }).catch(err => {
        res.status(500).json({ error: 'Error al procesar login' });
    });
});

    app.post('/api/register', async (req, res) => {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password y email son requeridos' });
        }
        try {
            const newUser = new User({ username, password, email });
            await newUser.save();
            res.status(201).json({ message: 'Usuario registrado' });
        }
        catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ error: 'Username o email ya existe' });
            }
            res.status(500).json({ error: 'Error al registrar usuario' });
        }
    });

 app.put('/api/users/:id', async (req, res) => {        
    const { id } = req.params;
    try {
        const updated = await User.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'No encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }       
});

app.delete('/api/users/:id', async (req, res) => {                                          
    const { id } = req.params;
    try {
        const deleted = await User.findByIdAndDelete(id);       
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }   
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.delete('/api/users', async (req, res) => {
    try {
        await User.deleteMany({});  
        res.json({ message: 'Todos los usuarios eliminados' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuarios' });
    }
});

app.delete('api/users/:id', async (req, res) => {
    const { id } = req.params;          
    try {        const deleted = await User.findByIdAndDelete(id);       
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }                   
});

app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;      
    try {
        const user = await User.findById(id).lean();        
        if (!user) return res.status(404).json({ error: 'No encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }   
});

