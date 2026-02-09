const firestoreService = require('./backend/src/services/firestoreService');
const { admin } = require('./backend/src/config/firebaseAdmin');

async function test() {
    try {
        const usersSnapshot = await admin.firestore().collection('users').limit(5).get();
        console.log("USERS IN DB:");
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Name: ${data.name}, Phone: ${data.phone}, Role: ${data.role}, QR: ${data.doctor_qr_id}, Normalized: ${data.phone_normalized}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
