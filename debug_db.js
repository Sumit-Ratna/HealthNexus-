const { admin } = require('./backend/src/config/firebaseAdmin');

async function test() {
    try {
        const doctorsSnapshot = await admin.firestore().collection('users')
            .where('role', '==', 'doctor')
            .get();

        console.log("DOCTORS IN DB:");
        if (doctorsSnapshot.empty) {
            console.log("No doctors found.");
        }
        doctorsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Name: ${data.name}, QR: ${data.doctor_qr_id}, Phone: ${data.phone}`);
        });

        const usersSnapshot = await admin.firestore().collection('users')
            .limit(10)
            .get();
        console.log("\nALL USERS (LIMIT 10):");
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Name: ${data.name}, Phone: ${data.phone}, Normalized: ${data.phone_normalized}, Role: ${data.role}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
