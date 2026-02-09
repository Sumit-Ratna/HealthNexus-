const firestoreService = require('./services/firestoreService');

async function checkDoctor() {
    const doc = await firestoreService.db.collection('users')
        .where('role', '==', 'doctor')
        .get();

    doc.forEach(d => {
        console.log(`Doctor: "${d.data().name}"`);
        console.log(`ID: "${d.id}"`);
        console.log(`QR ID: "${d.data().doctor_qr_id}"`);
        console.log(`Role: "${d.data().role}"`);
        console.log('---');
    });
    process.exit(0);
}

checkDoctor();
