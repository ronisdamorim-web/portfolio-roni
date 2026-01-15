const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ✅ CORS e JSON
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ✅ Servir arquivos estáticos (site)
app.use(express.static(__dirname, { extensions: ["html"] }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// ✅ MULTER (UPLOAD DE IMAGENS)
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const caseId = req.headers["case-id"] || "temp";
    const dir = path.join(__dirname, "uploads", "cases", caseId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ ROTA DE UPLOAD
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nenhum arquivo enviado");
  }

  const caseId = req.headers["case-id"] || "temp";
  const relativePath = `uploads/cases/${caseId}/${req.file.filename}`;

  res.json({
    success: true,
    message: "Upload realizado com sucesso",
    filePath: relativePath,
  });
});

// ================================
// ✅ SALVAR DB DO CMS (GERAR db.js)
// ================================
app.post("/save-db", (req, res) => {
  try {
    const dbContent = req.body;

    // ✅ Conteúdo do arquivo JS que o site lê no Vercel
    const jsFileContent =
      `// Banco de dados oficial do site (gerado pelo CMS em ${new Date().toISOString()})\n` +
      `window.DB_CONTENT = ${JSON.stringify(dbContent, null, 2)};\n`;

    const outputPath = path.join(__dirname, "assets", "js", "db.js");

    // ✅ garantir pasta assets/js
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    fs.writeFileSync(outputPath, jsFileContent, "utf8");

    return res.json({
      success: true,
      message: "Site publicado com sucesso!",
      outputPath,
    });
  } catch (err) {
    console.error("Erro ao salvar DB:", err);
    return res.status(500).json({
      success: false,
      message: "Erro ao salvar DB",
      error: err.message,
    });
  }
});

// ================================
// ✅ START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Pasta de uploads pronta`);
});
