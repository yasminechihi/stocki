const db = require('./database');

async function seedAllUsers() {
    console.log('🌍 Génération de données pour TOUS les utilisateurs...');

    // 1. Get functional IDs
    const [prod] = await db.promise().query("SELECT id FROM produits LIMIT 1");
    const [mag] = await db.promise().query("SELECT id FROM magasins LIMIT 1");
    const [cat] = await db.promise().query("SELECT id FROM categories LIMIT 1");

    // GET ALL USERS
    const [users] = await db.promise().query("SELECT id, name FROM users");

    if (!prod[0] || !mag[0] || !cat[0] || users.length === 0) {
        console.error("❌ Données manquantes.");
        process.exit(1);
    }

    const pId = prod[0].id;
    const mId = mag[0].id;
    const cId = cat[0].id;

    const movements = [];
    const today = new Date();

    console.log(`Found ${users.length} users. Seeding for each...`);

    for (const user of users) {
        console.log(` > Seeding for ${user.name} (ID: ${user.id})`);
        const uId = user.id;

        // 7 Days of data
        for (let i = 0; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            movements.push([uId, pId, mId, cId, 'entree', Math.floor(Math.random() * 10) + 5, 120, dateStr, `Auto User ${uId}`]);
            movements.push([uId, pId, mId, cId, 'sortie', Math.floor(Math.random() * 5) + 1, 120, dateStr, `Auto User ${uId}`]);
        }
    }

    const sql = "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES ?";

    try {
        const [res] = await db.promise().query(sql, [movements]);
        console.log(`✅ ${res.affectedRows} mouvements insérés pour TOUS les users !`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur insertion:", err);
        process.exit(1);
    }
}

seedAllUsers();
