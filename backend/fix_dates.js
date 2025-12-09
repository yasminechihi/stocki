const db = require('./database');

async function distributeDates() {
    console.log('🗓️ Redistribution des dates des mouvements...');

    // 1. Get all movements IDs
    const [rows] = await db.promise().query("SELECT id FROM mouvements_stock");

    if (rows.length === 0) {
        console.log("⚠️ Aucun mouvement trouvé à mettre à jour.");
        process.exit(0);
    }

    console.log(`Found ${rows.length} movements. Updating dates...`);

    let updated = 0;
    const today = new Date();

    for (const row of rows) {
        // Random day between 0 (today) and 25 days ago
        const daysAgo = Math.floor(Math.random() * 25);

        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);

        // Mysql format 'YYYY-MM-DD HH:mm:ss'
        const dateStr = d.toISOString().slice(0, 19).replace('T', ' ');
        const dateOnly = d.toISOString().split('T')[0];

        // Update BOTH created_at and date_mouvement to be safe
        const sql = "UPDATE mouvements_stock SET created_at = ?, date_mouvement = ? WHERE id = ?";

        await db.promise().query(sql, [dateStr, dateOnly, row.id]);
        updated++;
    }

    console.log(`✅ ${updated} mouvements mis à jour avec des dates réparties sur les 25 derniers jours.`);
    process.exit(0);
}

distributeDates();
