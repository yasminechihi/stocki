const express = require("express");
const app = express();
const cors = require("cors");
const conn = require("./database");

app.use(cors());
app.use(express.json());

// Route de test
app.get("/", (req, res) => {
  res.json({ message: "API Stocki fonctionne!" });
});

// Test connexion base de données
app.get("/test-db", (req, res) => {
  conn.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      console.error("❌ Erreur DB:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
    res.json({ message: "✅ DB connection OK", result: results[0].result });
  });
});

// Route categories
app.get("/categories", (req, res) => {
  console.log("📥 Requête /categories reçue");
  
  conn.query("SELECT * FROM categories", (err, rows) => {
    if (err) {
      console.error("❌ Erreur SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ ${rows.length} catégories trouvées`);
    res.json(rows);
  });
});

// CHANGEMENT ICI : Port 3001 au lieu de 3000
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`🏠 Test: http://localhost:${PORT}/`);
  console.log(`🗄️  Test DB: http://localhost:${PORT}/test-db`);
  console.log(`📊 Catégories: http://localhost:${PORT}/categories`);
});