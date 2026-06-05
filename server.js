const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/distribuidora';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
    // Start server only after successful DB connection
    const server = app.listen(PORT, () => {
        console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Puerto ${PORT} en uso. Cierra el proceso que lo usa o cambia PORT.`);
            process.exit(1);
        } else {
            console.error('Error en el servidor:', err);
        }
    });

}).catch(err => {
    console.error('Error conectando a MongoDB:', err.message || err);
    process.exit(1);
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
