const express = require('express');
const cors = require('cors');
const { admin, db } = require('./config/firebaseAdmin');
const path = require('path');
require('dotenv').config();

const connectRoutes = require('./routes/connect');
const aiRoutes = require('./routes/ai');
const documentRoutes = require('./routes/documents');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctor');
const familyRoutes = require('./routes/family');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/doctor', doctorRoutes);

app.get('/', (req, res) => {
    res.send('HealthNexus API is Running with Firebase');
});

// Start Server with Firestore Check
if (db) {
    console.log('[SUCCESS] Firestore initialized successfully');
} else {
    console.warn('[WARNING] Firestore not initialized. Add service-account.json to enable database.');
}

app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[DATABASE] Firebase Firestore`);
});
