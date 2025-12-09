const db = require('./database');

async function sedUrgent() {
    console.log('🚨 URGENT: Insérer un mouvement CLAIREMENT visible pour l\'utilisateur...');

    const movements = [];
    const today = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Insert for IDs 1 to 10 to be safe
    for (let u = 1; u <= 10; u++) {
        movements.push([u, 3, 2, 8, 'entree', 999, 100, today, `URGENT TEST USER ${u}`]);
    }

    const sql = "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES ?";

    try {
        const [res] = await db.promise().query(sql, [movements]);
        console.log(`✅ ${res.affectedRows} mouvements URGENTS insérés !`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur:", err);
        process.exit(1);
    }
}

sedUrgent();
