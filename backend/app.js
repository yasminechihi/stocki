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

// === TRANSPORTEUR EMAIL (GMAIL) ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Vérifier la configuration du transporter (optionnel mais utile pour debug)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Erreur configuration transporter:", err);
  } else {
    console.log("✅ Transporter email prêt");
  }
});

// === MIDDLEWARE D'AUTHENTIFICATION (JWT) ===
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

// === ROUTES DE BASE ===
app.get("/", (req, res) => {
  res.json({ message: "API Stocki fonctionne!" });
});

app.get("/test-db", (req, res) => {
  conn.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      console.error("❌ Erreur DB:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
    res.json({ message: "✅ DB connection OK", result: results[0].result });
  });
});

// === INSCRIPTION ===
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

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

      const hashedPassword = await bcrypt.hash(password, 10);
      
      conn.query(
        "INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, true],
        (err, results) => {
          if (err) {
            console.error("❌ Erreur insertion DB:", err);
            return res.status(500).json({ message: "Erreur lors de la création du compte" });
          }

          const newUserId = results.insertId;
          
          const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Bienvenue sur Stocki !",
            html: `
              <h2>Bienvenue sur Stocki, ${name} !</h2>
              <p>Votre compte a été créé avec succès.</p>
              <p>Vous pouvez maintenant vous connecter et commencer à utiliser nos services.</p>
              <p>Cordialement,<br>L'équipe Stocki</p>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("❌ Erreur envoi email:", error);
            } else {
              console.log("✅ Email de bienvenue envoyé:", info.response);
            }
          });

          res.status(201).json({ 
            message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
            userId: newUserId,
            success: true
          });
        }
      );
    });
  } catch (error) {
    console.error("❌ Erreur inscription (Try/Catch):", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// === CONNEXION (login) avec envoi email 2FA ===
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Format d'email invalide" });
  }

  conn.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("❌ Erreur DB (SELECT):", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }
    if (!user.is_verified) {
      return res.status(400).json({ message: "Veuillez vérifier votre compte avant de vous connecter" });
    }

    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); 
    conn.query(
      "UPDATE users SET login_code = ?, code_expires = ? WHERE id = ?",
      [loginCode, codeExpires, user.id],
      (err) => {
        if (err) {
          console.error("❌ Erreur DB (UPDATE):", err);
          return res.status(500).json({ message: "Erreur serveur" });
        }

        // Envoi du mail contenant le code MFA
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Votre code de connexion sécurisé (2FA) - Stocki",
          html: `
            <h2>Connexion sécurisée à Stocki</h2>
            <p>Voici votre code de connexion :</p>
            <h1 style="letter-spacing:4px">${loginCode}</h1>
            <p>Ce code est valable 10 minutes.</p>
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("❌ Erreur envoi email 2FA:", error);
            return res.status(500).json({ message: "Erreur lors de l'envoi du code 2FA" });
          }

          console.log("📧 Code 2FA envoyé à:", email);

          res.json({
            message: "Code 2FA envoyé par email",
            requires2FA: true,
            userId: user.id
          });
        });
      }
    );
  });
});

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
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        process.env.JWT_SECRET || 'votre_secret_jwt',
        { expiresIn: '24h' }
      );
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

app.post("/api/resend-verification", (req, res) => {
  const { userId } = req.body;
  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }
    const user = results[0];
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    conn.query(
      "UPDATE users SET verification_code = ? WHERE id = ?",
      [verificationCode, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur serveur" });
        }
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
            console.error("❌ Erreur envoi email verification:", error);
            return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
          }
          res.json({ message: "Nouveau code envoyé par email" });
        });
      }
    );
  });
});

// RESEND 2FA
app.post("/api/resend-2fa", (req, res) => {
  const { userId } = req.body;
  
  conn.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }
    
    const user = results[0];
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);
    conn.query(
      "UPDATE users SET login_code = ?, code_expires = ? WHERE id = ?",
      [loginCode, codeExpires, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur serveur" });
        }

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: user.email,
          subject: "Nouveau code 2FA - Stocki",
          html: `
            <h2>Nouveau code de connexion</h2>
            <p>Voici votre nouveau code : <strong style="font-size:20px">${loginCode}</strong></p>
            <p>Valable 10 minutes.</p>
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("❌ Erreur envoi resend-2fa:", error);
            return res.status(500).json({ message: "Erreur lors de l'envoi de l'email 2FA" });
          }
          console.log("📧 Nouveau code 2FA envoyé à:", user.email);
          res.json({ message: "Nouveau code envoyé par email" });
        });
      }
    );
  });
});

/* === DASHBOARD, MAGASINS, CATEGORIES, PRODUITS, MOUVEMENTS, STOCK, VENTES, CONTACT, ETC.
   Les routes suivantes sont reprises et légèrement nettoyées depuis ton fichier original.
   Elles conservent toute la logique métier (requêtes SQL, protections JWT, validations).
   Je garde leur implémentation complète ici pour que tu aies le fichier entier prêt. */
// === DASHBOARD ===
app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const dashboardData = {};

  const queryGenerales = `
    SELECT 
      (SELECT COUNT(*) FROM produits WHERE user_id = ?) as total_produits,
      (SELECT COUNT(*) FROM magasins WHERE user_id = ?) as total_magasins,
      (SELECT COUNT(*) FROM categories WHERE user_id = ?) as total_categories,
      (SELECT COUNT(*) FROM produits WHERE user_id = ? AND DATE(created_at) = CURDATE()) as produits_ajoutes_aujourdhui,
      (SELECT COUNT(*) FROM produits WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as produits_cette_semaine,
      (SELECT COUNT(*) FROM produits WHERE user_id = ? AND type = 'Interne') as produits_internes,
      (SELECT COUNT(*) FROM produits WHERE user_id = ? AND type = 'Vente') as produits_vente,
      (SELECT COALESCE(SUM(prix), 0) FROM produits WHERE user_id = ? AND prix IS NOT NULL) as valeur_stock_total
  `;

  conn.query(queryGenerales, [userId, userId, userId, userId, userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur stats générales:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    dashboardData.generales = results[0];

    const queryCategories = `
      SELECT 
        c.nom as categorie_nom,
        c.code as categorie_code,
        COUNT(p.id) as nombre_produits
      FROM categories c
      LEFT JOIN produits p ON c.id = p.categorie_id AND c.user_id = p.user_id
      WHERE c.user_id = ?
      GROUP BY c.id, c.nom, c.code
      ORDER BY nombre_produits DESC
    `;

    conn.query(queryCategories, [userId], (err, results) => {
      if (err) {
        console.error("❌ Erreur stats catégories:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      dashboardData.produitsParCategorie = results;

      const queryEvolution = `
        SELECT 
          DATE(created_at) as date_ajout,
          COUNT(*) as nouveaux_produits
        FROM produits 
        WHERE user_id = ? 
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date_ajout ASC
      `;

      conn.query(queryEvolution, [userId], (err, results) => {
        if (err) {
          console.error("❌ Erreur stats évolution:", err);
          return res.status(500).json({ message: "Erreur serveur" });
        }
        
        dashboardData.evolution = results;

        const queryTopCategories = `
          SELECT 
            c.nom as categorie,
            c.code,
            COUNT(p.id) as nombre_produits
          FROM categories c
          LEFT JOIN produits p ON c.id = p.categorie_id
          WHERE c.user_id = ?
          GROUP BY c.id, c.nom, c.code
          ORDER BY nombre_produits DESC
          LIMIT 5
        `;

        conn.query(queryTopCategories, [userId], (err, results) => {
          if (err) {
            console.error("❌ Erreur top catégories:", err);
            return res.status(500).json({ message: "Erreur serveur" });
          }
          
          dashboardData.topCategories = results;

          const queryDerniersProduits = `
            SELECT 
              nom,
              code,
              type,
              prix,
              DATE(created_at) as date_ajout
            FROM produits 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            LIMIT 5
          `;

          conn.query(queryDerniersProduits, [userId], (err, results) => {
            if (err) {
              console.error("❌ Erreur derniers produits:", err);
              return res.status(500).json({ message: "Erreur serveur" });
            }
            
            dashboardData.derniersProduits = results;
            res.json(dashboardData);
          });
        });
      });
    });
  });
});

// === MAGASINS ===
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

app.post("/api/magasins", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { nom, code, type, adresse } = req.body;
  conn.query(
    "INSERT INTO magasins (user_id, nom, code, type, adresse) VALUES (?, ?, ?, ?, ?)",
    [userId, nom, code, type, adresse],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création magasin:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      conn.query("SELECT * FROM magasins WHERE id = ?", [results.insertId], (err, newMagasin) => {
        if (err) {
          return res.status(201).json({ 
            message: "Magasin créé avec succès",
            magasinId: results.insertId
          });
        }
        res.status(201).json(newMagasin[0]);
      });
    }
  );
});

app.put("/api/magasins/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const magasinId = req.params.id;
  const { nom, code, type, adresse } = req.body;
  conn.query(
    "UPDATE magasins SET nom = ?, code = ?, type = ?, adresse = ? WHERE id = ? AND user_id = ?",
    [nom, code, type, adresse, magasinId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur modification magasin:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Magasin non trouvé" });
      }
      conn.query("SELECT * FROM magasins WHERE id = ?", [magasinId], (err, updatedMagasin) => {
        if (err) {
          return res.json({ 
            message: "Magasin modifié avec succès",
            id: magasinId
          });
        }
        res.json(updatedMagasin[0]);
      });
    }
  );
});

app.delete("/api/magasins/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const magasinId = req.params.id;
  conn.query(
    "DELETE FROM magasins WHERE id = ? AND user_id = ?",
    [magasinId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur suppression magasin:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Magasin non trouvé" });
      }
      
      res.json({ message: "Magasin supprimé avec succès" });
    }
  );
});

// === CATEGORIES ===
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
      conn.query("SELECT * FROM categories WHERE id = ?", [results.insertId], (err, newCategory) => {
        if (err) {
          return res.status(201).json({ 
            message: "Catégorie créée avec succès",
            categorieId: results.insertId
          });
        }
        
        res.status(201).json(newCategory[0]);
      });
    }
  );
});

app.put("/api/categories/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const categoryId = req.params.id;
  const { nom, code, description } = req.body; 
  conn.query(
    "UPDATE categories SET nom = ?, code = ?, description = ? WHERE id = ? AND user_id = ?",
    [nom, code, description, categoryId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur modification catégorie:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      } 
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
      conn.query("SELECT * FROM categories WHERE id = ?", [categoryId], (err, updatedCategory) => {
        if (err) {
          return res.json({ 
            message: "Catégorie modifiée avec succès",
            id: categoryId
          });
        }
        
        res.json(updatedCategory[0]);
      });
    }
  );
});

app.delete("/api/categories/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const categoryId = req.params.id;
  conn.query(
    "DELETE FROM categories WHERE id = ? AND user_id = ?",
    [categoryId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur suppression catégorie:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
      res.json({ message: "Catégorie supprimée avec succès" });
    }
  );
});

// === PRODUITS ===
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

app.post("/api/produits", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { nom, code, type, prix, adresse } = req.body;
  conn.query(
    "INSERT INTO produits (user_id, nom, code, type, prix, adresse) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, nom, code, type, prix, adresse],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création produit:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      conn.query("SELECT * FROM produits WHERE id = ?", [results.insertId], (err, newProduit) => {
        if (err) {
          return res.status(201).json({ 
            message: "Produit créé avec succès",
            produitId: results.insertId
          });
        }
        res.status(201).json(newProduit[0]);
      });
    }
  );
});

app.put("/api/produits/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const produitId = req.params.id;
  const { nom, code, type, prix, adresse } = req.body;
  conn.query(
    "UPDATE produits SET nom = ?, code = ?, type = ?, prix = ?, adresse = ? WHERE id = ? AND user_id = ?",
    [nom, code, type, prix, adresse, produitId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur modification produit:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      conn.query("SELECT * FROM produits WHERE id = ?", [produitId], (err, updatedProduit) => {
        if (err) {
          return res.json({ 
            message: "Produit modifié avec succès",
            id: produitId
          });
        }
        res.json(updatedProduit[0]);
      });
    }
  );
});

app.delete("/api/produits/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const produitId = req.params.id;
  conn.query(
    "DELETE FROM produits WHERE id = ? AND user_id = ?",
    [produitId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur suppression produit:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      
      res.json({ message: "Produit supprimé avec succès" });
    }
  );
});

// === MOUVEMENTS STOCK ===
app.get("/api/mouvements", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT m.*, p.nom as produit_nom, c.nom as categorie_nom, mag.nom as magasin_nom
    FROM mouvements_stock m
    JOIN produits p ON m.produit_id = p.id
    JOIN categories c ON m.categorie_id = c.id
    JOIN magasins mag ON m.magasin_id = mag.id
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `;
  
  conn.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération mouvements:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

app.post("/api/mouvements", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif } = req.body;
  
  conn.query(
    "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur création mouvement:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      // Mettre à jour le stock actuel
      const signe = type_mouvement === 'entree' ? 1 : -1;
      const updateStockQuery = `
        INSERT INTO stock_actuel (user_id, produit_id, magasin_id, categorie_id, quantite, valeur_stock)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          quantite = quantite + (? * ?),
          valeur_stock = valeur_stock + (? * ? * ?)
      `;
      
      conn.query(updateStockQuery, [
        userId, produit_id, magasin_id, categorie_id, 
        signe * quantite, quantite * prix_unitaire,
        signe, quantite,
        signe, quantite, prix_unitaire
      ], (err) => {
        if (err) {
          console.error("❌ Erreur mise à jour stock:", err);
        }
        
        conn.query(`
          SELECT m.*, p.nom as produit_nom, c.nom as categorie_nom, mag.nom as magasin_nom
          FROM mouvements_stock m
          JOIN produits p ON m.produit_id = p.id
          JOIN categories c ON m.categorie_id = c.id
          JOIN magasins mag ON m.magasin_id = mag.id
          WHERE m.id = ?
        `, [results.insertId], (err, newMouvement) => {
          if (err) {
            return res.status(201).json({ 
              message: "Mouvement créé avec succès",
              mouvementId: results.insertId
            });
          }
          res.status(201).json(newMouvement[0]);
        });
      });
    }
  );
});

// === STOCK ACTUEL ===
app.get("/api/stock", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT s.*, p.nom as produit_nom, p.code as produit_code, p.type as produit_type,
           c.nom as categorie_nom, mag.nom as magasin_nom
    FROM stock_actuel s
    JOIN produits p ON s.produit_id = p.id
    JOIN categories c ON s.categorie_id = c.id
    JOIN magasins mag ON s.magasin_id = mag.id
    WHERE s.user_id = ?
    ORDER BY s.valeur_stock DESC
  `;
  
  conn.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération stock:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

// === VENTES ===
app.get("/api/ventes/stats", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { dateDebut, dateFin } = req.query;
  
  let whereClause = "WHERE user_id = ? AND type_mouvement = 'sortie'";
  const params = [userId];
  
  if (dateDebut && dateFin) {
    whereClause += " AND date_mouvement BETWEEN ? AND ?";
    params.push(dateDebut, dateFin);
  }
  
  const query = `
    SELECT 
      COALESCE(SUM(quantite * prix_unitaire), 0) as ca_total,
      COALESCE(SUM(CASE WHEN DATE(date_mouvement) = CURDATE() THEN quantite * prix_unitaire ELSE 0 END), 0) as ca_aujourdhui,
      COALESCE(SUM(CASE WHEN date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN quantite * prix_unitaire ELSE 0 END), 0) as ca_mois,
      COALESCE(SUM(quantite), 0) as quantite_vendue,
      COALESCE(AVG(quantite * prix_unitaire), 0) as moyenne_panier
    FROM mouvements_stock 
    ${whereClause}
  `;
  
  conn.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Erreur stats ventes:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results[0]);
  });
});

app.get("/api/ventes/top-produits", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      p.nom, p.code, c.nom as categorie,
      SUM(m.quantite) as quantite_vendue,
      SUM(m.quantite * m.prix_unitaire) as ca_produit
    FROM mouvements_stock m
    JOIN produits p ON m.produit_id = p.id
    JOIN categories c ON m.categorie_id = c.id
    WHERE m.user_id = ? AND m.type_mouvement = 'sortie'
      AND m.date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY p.id, p.nom, p.code, c.nom
    ORDER BY ca_produit DESC
    LIMIT 5
  `;
  
  conn.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur top produits:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

app.get("/api/ventes/evolution-ca", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      DATE(date_mouvement) as date,
      SUM(quantite * prix_unitaire) as ca
    FROM mouvements_stock 
    WHERE user_id = ? AND type_mouvement = 'sortie'
      AND date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(date_mouvement)
    ORDER BY date ASC
  `;
  
  conn.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur évolution CA:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

app.get("/api/ventes/par-categorie", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      c.nom as categorie,
      SUM(m.quantite * m.prix_unitaire) as ca,
      ROUND((SUM(m.quantite * m.prix_unitaire) * 100 / 
        (SELECT SUM(quantite * prix_unitaire) FROM mouvements_stock 
         WHERE user_id = ? AND type_mouvement = 'sortie' 
         AND date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))), 2) as pourcentage
    FROM mouvements_stock m
    JOIN categories c ON m.categorie_id = c.id
    WHERE m.user_id = ? 
      AND m.type_mouvement = 'sortie'
      AND m.date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY c.id, c.nom
    ORDER BY ca DESC
  `;
  
  conn.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur ventes par catégorie:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

app.get("/api/ventes/recentes", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const query = `
    SELECT 
      p.nom as produit,
      m.quantite,
      m.prix_unitaire as prix,
      m.date_mouvement as date,
      'Client' as client
    FROM mouvements_stock m
    JOIN produits p ON m.produit_id = p.id
    WHERE m.user_id = ? AND m.type_mouvement = 'sortie'
    ORDER BY m.created_at DESC
    LIMIT 10
  `;
  
  conn.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Erreur ventes récentes:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(results);
  });
});

// === CONTACT ===
app.post("/api/contact", (req, res) => {
  const { name, email, company, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Format d'email invalide" });
  }
  conn.query(
    "INSERT INTO contacts (name, email, company, subject, message) VALUES (?, ?, ?, ?, ?)",
    [name, email, company || null, subject, message],
    (err, results) => {
      if (err) {
        console.error("❌ Erreur insertion contact:", err);
        return res.status(500).json({ message: "Erreur lors de l'envoi du message" });
      }
      console.log("✅ Message de contact sauvegardé - ID:", results.insertId);
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

// === Liste publique de catégories (sans auth) ===
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

// === Récupération des contacts (protégé) ===
app.get("/api/contacts", authenticateToken, (req, res) => {
  conn.query("SELECT * FROM contacts ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("❌ Erreur récupération contacts:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    res.json({ contacts: results });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log(`🏠 Test: http://localhost:${PORT}/`);
  console.log(`🗄️  Test DB: http://localhost:${PORT}/test-db`);
  console.log(`📊 Catégories: http://localhost:${PORT}/categories`);
  console.log(`📧 Contact: http://localhost:${PORT}/api/contact`);
  console.log(`🔐 Routes auth: http://localhost:${PORT}/api/register | /api/login`);
  console.log(`🏪 Routes protégées: http://localhost:${PORT}/api/magasins | /api/categories | /api/produits`);
});
