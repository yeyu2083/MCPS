import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Asegurarse de que el directorio uploads existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configuración de middleware - orden importante
app.use(express.json()); // Primero parsear JSON
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
}));
app.use(express.static('app'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.post('/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ 
                status: false, 
                message: 'No se subió ningún archivo' 
            });
        }

        const file = req.files.file;
        const fileExt = path.extname(file.name).toLowerCase();
        
        if (!['.pdf', '.png'].includes(fileExt)) {
            return res.status(400).json({ 
                status: false, 
                message: 'Solo se permiten archivos PDF y PNG' 
            });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(uploadsDir, fileName);

        await file.mv(uploadPath);

        res.json({
            status: true,
            message: 'Archivo subido correctamente',
            data: {
                name: fileName,
                size: file.size,
                type: file.mimetype
            }
        });
    } catch (err) {
        console.error('Error al subir archivo:', err);
        res.status(500).json({
            status: false,
            message: 'Error al subir el archivo',
            error: err.message
        });
    }
});

app.get('/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Error al leer los archivos',
                error: err.message
            });
        }

        // Agrupar archivos por nombre base (sin timestamp)
        const uniqueFiles = new Map();
        files.forEach(file => {
            const baseFileName = file.split('-').slice(1).join('-');
            const stats = fs.statSync(path.join(uploadsDir, file));
            
            // Si ya existe un archivo con el mismo nombre base, mantener solo el más reciente
            if (!uniqueFiles.has(baseFileName) || 
                stats.mtime > uniqueFiles.get(baseFileName).uploadDate) {
                uniqueFiles.set(baseFileName, {
                    name: file,
                    size: stats.size,
                    uploadDate: stats.mtime
                });
            }
        });

        res.json({
            status: true,
            files: Array.from(uniqueFiles.values())
        });
    });
});

app.post('/delete-file', (req, res) => {
    try {
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({
                status: false,
                message: 'Nombre de archivo no proporcionado'
            });
        }

        // Obtener el nombre base del archivo (sin timestamp)
        const baseFileName = fileName.includes('-') ? fileName.split('-').slice(1).join('-') : fileName;
        
        // Buscar y eliminar todos los archivos que coincidan con el nombre base
        fs.readdir(uploadsDir, (err, files) => {
            if (err) throw err;
            
            files.forEach(file => {
                if (file.includes(baseFileName)) {
                    fs.unlinkSync(path.join(uploadsDir, file));
                }
            });
        });

        res.json({
            status: true,
            message: 'Archivo eliminado correctamente'
        });
    } catch (err) {
        console.error('Error al eliminar archivo:', err);
        res.status(500).json({
            status: false,
            message: 'Error al eliminar el archivo',
            error: err.message
        });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});