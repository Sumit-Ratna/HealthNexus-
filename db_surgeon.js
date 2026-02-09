const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function runSurgeon() {
    console.log("=== GLOBAL DATABASE SURGEON STARTING ===");

    const usersSnap = await db.collection('users').get();
    console.log(`Processing ${usersSnap.size} users...`);

    let fixedCount = 0;

    for (const doc of usersSnap.docs) {
        const data = doc.data();
        const updates = {};

        // 1. Fix phone_normalized
        const phone = data.phone || '';
        const digits = phone.replace(/\D/g, '');
        const correctNormalized = digits.length >= 10 ? digits.slice(-10) : digits;

        if (data.phone_normalized !== correctNormalized || data.phone_normalized === 'undefined') {
            console.log(`[FIX] User ${data.name} (${doc.id}): phone_normalized -> ${correctNormalized}`);
            updates.phone_normalized = correctNormalized;
        }

        // 2. Fix doctor_qr_id
        if (data.role === 'doctor' && data.doctor_qr_id) {
            const cleanQr = data.doctor_qr_id.trim().toUpperCase();
            if (data.doctor_qr_id !== cleanQr) {
                console.log(`[FIX] Doctor ${data.name}: qr_id "${data.doctor_qr_id}" -> "${cleanQr}"`);
                updates.doctor_qr_id = cleanQr;
            }
        }

        // 3. Fix role casing
        if (data.role && typeof data.role === 'string') {
            const lowerRole = data.role.toLowerCase();
            if (data.role !== lowerRole) {
                console.log(`[FIX] User ${data.name}: role "${data.role}" -> "${lowerRole}"`);
                updates.role = lowerRole;
            }
        }

        if (Object.keys(updates).length > 0) {
            await doc.ref.update({
                ...updates,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            fixedCount++;
        }
    }

    console.log(`\n=== SURGERY COMPLETE. Fixed ${fixedCount} users. ===`);
}

runSurgeon().catch(console.error);
