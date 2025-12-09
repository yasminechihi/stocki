const db = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Début du peuplement de la base de données...');

    try {
        // 1. Récupérer ou créer un utilisateur
        const user = await new Promise((resolve, reject) => {
            db.query("SELECT id FROM users LIMIT 1", async (err, results) => {
                if (err) return reject(err);
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    // Créer un user par défaut si aucun n'existe
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    db.query(
                        "INSERT INTO users (name, email, password, is_verified) VALUES (?, ?, ?, ?)",
                        ['Demo User', 'demo@stocki.com', hashedPassword, true],
                        (err, res) => {
                            if (err) return reject(err);
                            console.log('✅ Utilisateur démo créé (email: demo@stocki.com / pass: password123)');
                            resolve({ id: res.insertId });
                        }
                    );
                }
            });
        });

        const userId = user.id;
        console.log(`📌 Utilisation du User ID: ${userId}`);

        // 2. Créer Magasin, Catégorie, Produit (si nécessaires pour FK)
        const magasinId = await new Promise((resolve, reject) => {
            db.query("INSERT INTO magasins (user_id, nom, code, type, adresse) VALUES (?, 'Magasin Principal', 'MAG01', 'Principal', 'Tunis') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)", [userId], (err, res) => {
                if (err) return reject(err);
                resolve(res.insertId);
            });
        });

        const categoryId = await new Promise((resolve, reject) => {
            db.query("INSERT INTO categories (user_id, name, code, description) VALUES (?, 'Électronique', 'ELEC', 'Appareils électroniques') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)", [userId], (err, res) => {
                if (err) return reject(err);
                resolve(res.insertId);
            });
        });

        const productId = await new Promise((resolve, reject) => {
            db.query("INSERT INTO produits (user_id, nom, code, type, prix, adresse) VALUES (?, 'Smartphone Demo', 'P001', 'Vente', 1200, 'Etagère A') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)", [userId], (err, res) => {
                if (err) return reject(err);
                resolve(res.insertId);
            });
        });

        console.log(`📦 Dépendances prêtes (Magasin: ${magasinId}, Catégorie: ${categoryId}, Produit: ${productId})`);

        // 3. Générer des mouvements sur 90 jours
        const movements = [];
        const today = new Date();

        // Générer environ 50 mouvements
        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 90);
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split('T')[0];

            const type = Math.random() > 0.5 ? 'entree' : 'sortie';
            const quantity = Math.floor(Math.random() * 20) + 1;

            movements.push([
                userId,
                productId,
                magasinId,
                categoryId,
                type,
                quantity,
                1200,
                dateStr,
                `Mouvement auto ${i}`
            ]);
        }

        // Insertion en masse
        const sql = "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES ?";

        await new Promise((resolve, reject) => {
            db.query(sql, [movements], (err, res) => {
                if (err) return reject(err);
                console.log(`✅ ${res.affectedRows} mouvements insérés avec succès !`);
                resolve();
            });
        });

        console.log('🎉 Terminé ! Actualisez votre dashboard.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

seed();
