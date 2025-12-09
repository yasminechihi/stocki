const db = require('./database');

async function seedRecent() {
    console.log('🌱 Adding recent data for debugging...');
    const userId = 1; // Assuming User 1

    // Get product/magasin/category IDs
    const [prod] = await db.promise().query("SELECT id FROM produits LIMIT 1");
    const [mag] = await db.promise().query("SELECT id FROM magasins LIMIT 1");
    const [cat] = await db.promise().query("SELECT id FROM categories LIMIT 1");

    if (!prod[0] || !mag[0] || !cat[0]) {
        console.error("Missing base data");
        process.exit(1);
    }

    const pId = prod[0].id;
    const mId = mag[0].id;
    const cId = cat[0].id;

    const movements = [];

    // Insert 10 movements for TODAY
    for (let i = 0; i < 10; i++) {
        movements.push([userId, pId, mId, cId, 'entree', 10, 500, new Date(), 'Debug Today']);
    }

    // Insert 10 movements for YESTERDAY
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    for (let i = 0; i < 10; i++) {
        movements.push([userId, pId, mId, cId, 'sortie', 5, 500, yest, 'Debug Yesterday']);
    }

    const sql = "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES ?";

    await db.promise().query(sql, [movements]);
    console.log("✅ Added 20 new movements for Today and Yesterday.");
    process.exit();
}

seedRecent();
