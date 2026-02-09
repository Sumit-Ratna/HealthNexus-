const admin = require('firebase-admin');

// [WARNING] WARNING: 
// To verify tokens securely, you MUST provide a Service Account JSON file.
// 1. Go to Firebase Console -> Project Settings -> Service Accounts
// 2. Generate new private key -> Download JSON
// 3. Save it as `service-account.json` in `backend/` folder (DO NOT COMMIT THIS FILE!)
// 4. Update the `serviceAccountPath` below if needed.

const path = require('path');
const serviceAccountPath = path.join(__dirname, '../../service-account.json');

try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // [DEPLOYMENT] Use Environment Variable
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("[FIREBASE] Loading credentials from Environment Variable");
        } catch (e) {
            console.error("[ERROR] Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
        }
    } else {
        // [LOCAL] Use File
        try {
            serviceAccount = require(serviceAccountPath);
            console.log("[FIREBASE] Loading credentials from local file");
        } catch (e) {
            // File not found, will be handled below
        }
    }

    if (serviceAccount && !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        // Enable ignoreUndefinedProperties
        admin.firestore().settings({
            ignoreUndefinedProperties: true
        });

        console.log("[FIREBASE] Admin SDK initialized successfully");
    } else if (!serviceAccount) {
        throw new Error("No service account credentials found (Env Var or File)");
    }
} catch (error) {
    console.error("[ERROR] Firebase Admin initialization failed:", error.message);
}

const db = admin.apps.length ? admin.firestore() : null;
if (db) {
    db.settings({ ignoreUndefinedProperties: true });
}

module.exports = { admin, db };
