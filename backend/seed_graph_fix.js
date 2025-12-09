const db = require('./database');

async function seedGraphData() {
    console.log('📈 Génération de données pour le Graphe (7 derniers jours continus)...');

    // 1. Get functional IDs
    const [prod] = await db.promise().query("SELECT id FROM produits LIMIT 1");
    const [mag] = await db.promise().query("SELECT id FROM magasins LIMIT 1");
    const [cat] = await db.promise().query("SELECT id FROM categories LIMIT 1");
    const [usr] = await db.promise().query("SELECT id FROM users LIMIT 1");

    if (!prod[0] || !mag[0] || !cat[0] || !usr[0]) {
        console.error("❌ Impossible de trouver les données de base (Produit/Magasin/Catégorie/User).");
        process.exit(1);
    }

    const pId = prod[0].id;
    const mId = mag[0].id;
    const cId = cat[0].id;
    const uId = usr[0].id;

    console.log(`Utilisation: User ${uId}, Prod ${pId}, Mag ${mId}, Cat ${cId}`);

    const movements = [];
    const today = new Date();

    // 2. Generate data for EACH day of the last 10 days
    for (let i = 0; i <= 10; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        // Mysql Date Format YYYY-MM-DD
        const dateStr = d.toISOString().split('T')[0];

        // Add Entree
        movements.push([uId, pId, mId, cId, 'entree', Math.floor(Math.random() * 10) + 5, 100, dateStr, `Saisie Auto Jour -${i}`]);

        // Add Sortie
        movements.push([uId, pId, mId, cId, 'sortie', Math.floor(Math.random() * 5) + 1, 100, dateStr, `Saisie Auto Jour -${i}`]);
    }

    // 3. Insert
    const sql = "INSERT INTO mouvements_stock (user_id, produit_id, magasin_id, categorie_id, type_mouvement, quantite, prix_unitaire, date_mouvement, motif) VALUES ?";

    try {
        const [res] = await db.promise().query(sql, [movements]);
        console.log(`✅ ${res.affectedRows} mouvements insérés !`);
        console.log("Les dates couvrent les 10 derniers jours sans interruption.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur insertion:", err);
        process.exit(1);
    }
}

seedGraphData();
