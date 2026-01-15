const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Configurar CORS e JSON
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (seu site)
app.use(express.static(__dirname, { extensions: ['html'] }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar Storage do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Pega o ID do case do corpo da requisição ou usa 'temp'
        const caseId = req.headers['case-id'] || 'temp';
        const dir = path.join(__dirname, 'uploads', 'cases', caseId);

        // Criar diretório se não existir
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Nome do arquivo: timestamp + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rota de Upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado');
    }

    // Caminho relativo para salvar no JSON
    // Ex: uploads/cases/sindona-paraiso/image-123456.jpg
    const caseId = req.headers['case-id'] || 'temp';

    // Normalizar caminho para usar barras normais (/) mesmo no Windows
    const relativePath = `uploads/cases/${caseId}/${req.file.filename}`;

    res.json({
        message: 'Upload realizado com sucesso',
        filePath: relativePath
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📁 Pasta de uploads pronta`);
});
