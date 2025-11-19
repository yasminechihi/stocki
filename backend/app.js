require('dotenv').config();

const express = require("express");
const app = express();
const cors = require("cors");
const conn = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

app.use(cors());
app.use(express.json());

// Configuration email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token d'accès requis" });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt', (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide" });
    }
    req.user = user;
    next();
  });
};

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

// Route d'inscription
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation des données
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérifier si l'utilisateur existe déjà
    conn.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("❌ Erreur DB (SELECT):", err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ message: "Table 'users' manquante. Avez-vous exécuté le script SQL de création ?" });
        }
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Générer un code de vérification (6 chiffres)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Insérer l'utilisateur dans la base de données
      conn.query(
        "INSERT INTO users (name, email, password, verification_code, is_verified) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, verificationCode, false],
        (err, results) => {
          if (err) {
            console.error("❌ Erreur insertion DB:", err);
            return res.status(500).json({ message: "Erreur lors de la création du compte" });
          }
          
          const newUserId = results.insertId;
          
          // Envoyer l'email de vérification
          const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Code de vérification - Stocki",
            html: `
              <h2>Bienvenue sur Stocki !</h2>
              <p>Votre code de vérification est : <strong>${verificationCode}</strong></p>
              <p>Utilisez ce code pour activer votre compte.</p>
              <p>Ce code expirera dans 10 minutes.</p>
            `
          };
          
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("❌ Erreur envoi email:", error);
              return res.status(500).json({ 
                message: "Compte créé, mais erreur lors de l'envoi de l'email de vérification",
                userId: newUserId,
                requiresVerification: true
              });
            }
            
            console.log("✅ Email envoyé:", info.response);
            res.status(201).json({ 
              message: "Compte créé avec succès. Vérifiez votre email pour le code de validation.",
              userId: newUserId,
              requiresVerification: true
            });
          });
        }
      );
    });
    
  } catch (error) {
    console.error("❌ Erreur inscription (Try/Catch):", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route de connexion
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }
  
  // Vérifier l'utilisateur
  conn.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("❌ Erreur DB (SELECT):", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    if (results.length === 0) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const user = results[0];
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }
    
    // Vérifier si le compte est activé
    if (!user.is_verified) {
      return res.status(400).json({ message: "Veuillez vérifier votre compte avant de vous connecter" });
    }
    
    // Générer un code de connexion (6 chiffres)
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Sauvegarder le code en base
    conn.query(
      "UPDATE users SET login_code = ?, code_expires = ? WHERE id = ?",
      [loginCode, codeExpires, user.id],
      (err) => {
        if (err) {
          console.error("❌ Erreur DB (UPDATE):", err);
          return res.status(500).json({ message: "Erreur serveur" });
        }
        
        // Afficher le code dans la console pour test
        console.log('✅ Code de sécurité généré pour', email, ':', loginCode);
        console.log('🔐 Utilisez ce code dans le popup 2FA:', loginCode);
        
        res.json({ 
          message: "Code de sécurité généré (voir console du serveur)",
          requires2FA: true,
          userId: user.id,
          debugCode: loginCode
        });
      }
    );
  });
});

// Route de vérification du code de connexion
app.post("/api/verify-login", (req, res) => {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({ message: "ID utilisateur et code requis" });
  }
  
  conn.query(
    "SELECT * FROM users WHERE id = ? AND login_code = ? AND code_expires > NOW()",
    [userId, code],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur DB:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ message: "Code invalide ou expiré" });
      }
      
      const user = results[0];
      
      // Générer le token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        process.env.JWT_SECRET || 'votre_secret_jwt',
        { expiresIn: '24h' }
      );
      
      // Effacer le code utilisé
      conn.query(
        "UPDATE users SET login_code = NULL, code_expires = NULL WHERE id = ?",
        [user.id]
      );
      
      res.json({
        message: "Connexion réussie",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  );
});

// Route de vérification du compte (après inscription)
app.post("/api/verify-account", (req, res) => {
  const { userId, code } = req.body;
  
  conn.query(
    "SELECT * FROM users WHERE id = ? AND verification_code = ?",
    [userId, code],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur DB:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ message: "Code de vérification invalide" });
      }
      
      // Activer le compte
      conn.query(
        "UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = ?",
        [userId],
        (err) => {
          if (err) {
            console.error("❌ Erreur activation compte:", err);
            return res.status(500).json({ message: "Erreur lors de l'activation du compte" });
          }
          
          res.json({ message: "Compte activé avec succès" });
        }
      );
    }
  );
});

// Route pour renvoyer le code de vérification
app.post("/api/resend-verification", (req, res) => {
  const { userId } = req.body;
  
  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }
    
    const user = results[0];
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Mettre à jour le code de vérification
    conn.query(
      "UPDATE users SET verification_code = ? WHERE id = ?",
      [verificationCode, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur serveur" });
        }
        
        // Renvoyer l'email
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: user.email,
          subject: "Nouveau code de vérification - Stocki",
          html: `
            <h2>Nouveau code de vérification</h2>
            <p>Votre nouveau code de vérification est : <strong>${verificationCode}</strong></p>
            <p>Utilisez ce code pour activer votre compte.</p>
          `
        };
        
        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
          }
          
          res.json({ message: "Nouveau code envoyé par email" });
        });
      }
    );
  });
});

// Route pour renvoyer le code 2FA
app.post("/api/resend-2fa", (req, res) => {
  const { userId } = req.body;
  
  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }
    
    const user = results[0];
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    // Mettre à jour le code
    conn.query(
      "UPDATE users SET login_code = ?, code_expires = ? WHERE id = ?",
      [loginCode, codeExpires, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur serveur" });
        }
        
        // Afficher le code dans la console
        console.log('✅ Nouveau code de sécurité pour', user.email, ':', loginCode);
        
        res.json({ 
          message: "Nouveau code généré (voir console)",
          debugCode: loginCode
        });
      }
    );
  });
});

// ROUTES POUR LES DONNÉES UTILISATEUR

// Route pour les magasins de l'utilisateur
app.get("/api/magasins", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  conn.query("SELECT * FROM magasins WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération magasins:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    res.json(results);
  });
});

// Route pour les catégories de l'utilisateur
app.get("/api/categories", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  conn.query("SELECT * FROM categories WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération catégories:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    res.json(results);
  });
});

// Route pour les produits de l'utilisateur
app.get("/api/produits", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  conn.query("SELECT * FROM produits WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération produits:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    res.json(results);
  });
});

// Route pour ajouter un magasin
app.post("/api/magasins", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { nom, code, type, adresse, image } = req.body;
  
  conn.query(
    "INSERT INTO magasins (user_id, nom, code, type, adresse, image) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, nom, code, type, adresse, image],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création magasin:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      res.status(201).json({ 
        message: "Magasin créé avec succès",
        magasinId: results.insertId
      });
    }
  );
});

// Route pour ajouter une catégorie
app.post("/api/categories", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { nom, code, description } = req.body;
  
  conn.query(
    "INSERT INTO categories (user_id, nom, code, description) VALUES (?, ?, ?, ?)",
    [userId, nom, code, description],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création catégorie:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      res.status(201).json({ 
        message: "Catégorie créée avec succès",
        categorieId: results.insertId
      });
    }
  );
});

// Route pour ajouter un produit
app.post("/api/produits", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { nom, code, type, prix, adresse, image } = req.body;
  
  conn.query(
    "INSERT INTO produits (user_id, nom, code, type, prix, adresse, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, nom, code, type, prix, adresse, image],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création produit:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      res.status(201).json({ 
        message: "Produit créé avec succès",
        produitId: results.insertId
      });
    }
  );
});

// ROUTE FORMULAIRE DE CONTACT
app.post("/api/contact", (req, res) => {
  const { name, email, company, subject, message } = req.body;
  
  // Validation des données requises
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
  }
  
  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Format d'email invalide" });
  }
  
  // Insertion dans la base de données
  conn.query(
    "INSERT INTO contacts (name, email, company, subject, message) VALUES (?, ?, ?, ?, ?)",
    [name, email, company || null, subject, message],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur insertion contact:", err);
        return res.status(500).json({ message: "Erreur lors de l'envoi du message" });
      }
      
      console.log("✅ Message de contact sauvegardé - ID:", results.insertId);
      
      // Envoyer un email de confirmation
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Confirmation de réception - Stocki",
        html: `
          <h2>Merci pour votre message !</h2>
          <p>Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais.</p>
          <p><strong>Résumé de votre message :</strong></p>
          <ul>
            <li><strong>Sujet :</strong> ${subject}</li>
            <li><strong>Message :</strong> ${message.substring(0, 100)}...</li>
          </ul>
          <p>Cordialement,<br>L'équipe Stocki</p>
        `
      };
      
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error("❌ Erreur envoi email confirmation:", error);
        } else {
          console.log("✅ Email de confirmation envoyé à:", email);
        }
      });
      
      res.status(201).json({ 
        message: "Message envoyé avec succès", 
        contactId: results.insertId 
      });
    }
  );
});

// Route categories (legacy - à supprimer progressivement)
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

// ROUTE: Récupérer tous les contacts (pour admin)
app.get("/api/contacts", authenticateToken, (req, res) => {
  conn.query("SELECT * FROM contacts ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération contacts:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    res.json({ contacts: results });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`🏠 Test: http://localhost:${PORT}/`);
  console.log(`🗄️  Test DB: http://localhost:${PORT}/test-db`);
  console.log(`📊 Catégories: http://localhost:${PORT}/categories`);
  console.log(`📧 Contact: http://localhost:${PORT}/api/contact`);
  console.log(`🔐 Routes auth: http://localhost:${PORT}/api/register | /api/login`);
  console.log(`🏪 Routes protégées: http://localhost:${PORT}/api/magasins | /api/categories | /api/produits`);
});