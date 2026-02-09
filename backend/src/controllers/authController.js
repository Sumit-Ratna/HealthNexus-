const firestoreService = require('../services/firestoreService');
const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Generate JWT Tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

// Check User Existence & Direct Login
exports.sendOtp = async (req, res) => {
    const { phone, role = 'patient' } = req.body;
    console.log(`[AUTH] Direct Login/Check Request: ${phone}`);

    try {
        const user = await firestoreService.getUserByPhone(phone);

        if (user) {
            console.log(`[AUTH] User found. Generating tokens for direct login.`);
            const tokens = generateTokens(user);

            // Update refresh token
            await firestoreService.updateUser(user.id, {
                refresh_token: tokens.refreshToken
            });

            // Prepare safe user object
            const safeUser = { ...user };
            delete safeUser.refresh_token;

            return res.json({
                message: "Direct Login Successful",
                isNew: false,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: safeUser
            });
        }

        // For new users, return isNew: true so frontend can show signup
        res.json({ message: "User not found", isNew: true });
    } catch (err) {
        console.error("Direct Login Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Verify Firebase Token & Login
exports.verifyOtp = async (req, res) => {
    const { phone, firebaseToken, role = 'patient' } = req.body;
    console.log(`[AUTH] Login Attempt (Firebase): ${phone}, Role: ${role}`);

    try {
        // 1. Verify Firebase Token (OR Bypass if Fixed OTP)
        if (req.body.otp === '123456') {
            console.log("[AUTH] Bypassing Firebase Token verification for Fixed OTP.");
        } else if (admin && admin.apps.length) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
                if (decodedToken.phone_number && phone && !decodedToken.phone_number.includes(phone.slice(-10))) {
                    console.warn("Phone mismatch warning:", decodedToken.phone_number, phone);
                }
            } catch (e) {
                console.error("Firebase Verify Error:", e);
                return res.status(401).json({ error: "Invalid Firebase Token" });
            }
        } else {
            console.warn("[WARNING] Firebase Admin missing. Accepting token without verification (DEV MODE).");
        }

        // 2. Find User in Firestore
        let user = await firestoreService.getUserByPhone(phone);

        if (!user) {
            return res.status(404).json({
                error: "User not found. Please Sign Up.",
                isNewUser: true
            });
        }

        if (user.role !== role) {
            return res.status(403).json({ error: `Registered as ${user.role}. Please switch portals.` });
        }

        const tokens = generateTokens(user);

        // Update refresh token
        await firestoreService.updateUser(user.id, {
            refresh_token: tokens.refreshToken
        });

        // Prepare safe user object
        const safeUser = { ...user };
        delete safeUser.refresh_token;

        res.json({
            message: "Login Successful",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: safeUser
        });

    } catch (err) {
        console.error("[ERROR] Login Error:", err);
        return res.status(500).json({ error: "Login failed", details: err.message });
    }
};

// Register New User
exports.register = async (req, res) => {
    const { phone, firebaseToken, role, name, age, dob, gender, blood_group } = req.body;
    console.log(`[UPDATE] Register (Firebase): ${phone}, Role: ${role}`);

    try {
        // 1. Verify Token (OR Bypass if Fixed OTP)
        if (req.body.otp === '123456') {
            console.log("[AUTH] Bypassing Firebase Token verification for Fixed OTP registration.");
        } else if (admin && admin.apps.length) {
            try {
                await admin.auth().verifyIdToken(firebaseToken);
            } catch (e) {
                console.error("Firebase Token Verify Error:", e);
                return res.status(401).json({ error: "Invalid Authentication Token" });
            }
        } else {
            console.warn("[WARNING] Firebase Admin missing. Accepting token without verification (DEV MODE).");
        }

        let user = await firestoreService.getUserByPhone(phone);
        if (user) {
            return res.status(409).json({ error: "User already exists. Please Login." });
        }

        let finalDob = dob;
        if (!finalDob && age) {
            const date = new Date();
            date.setFullYear(date.getFullYear() - parseInt(age));
            finalDob = date.toISOString().split('T')[0];
        }

        // Prepare base user data
        const userData = {
            ...req.body, // Include all fields sent by frontend
            phone,
            role: role || 'patient',
            name: name || 'New User',
            dob: finalDob,
            gender: gender || 'Male',
            blood_group: blood_group || 'O+'
        };

        // Remove safety-critical/duplicate fields
        delete userData.firebaseToken;
        delete userData.otp;

        // Add doctor-specific logic
        if (role === 'doctor') {
            userData.specialization = req.body.specialization || 'General Physician';
            userData.hospital_name = req.body.hospital_name || 'HealthNexus Clinic';
            userData.doctor_qr_id = 'DOC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        }

        const userId = uuidv4();
        user = await firestoreService.createUser(userId, userData);

        const tokens = generateTokens(user);
        await firestoreService.updateUser(user.id, {
            refresh_token: tokens.refreshToken
        });

        res.status(201).json({
            message: "Registration Successful",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                ...userData
            }
        });

    } catch (err) {
        console.error("[ERROR] Registration Error:", err);
        res.status(500).json({ error: "Registration failed: " + err.message });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await firestoreService.getUser(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        const tokens = generateTokens(user);
        await firestoreService.updateUser(user.id, {
            refresh_token: tokens.refreshToken
        });

        res.json(tokens);
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        let user = await firestoreService.getUser(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Auto-migrate: Add phone_normalized if missing or "undefined"
        const isCorrupted = !user.phone_normalized || user.phone_normalized === 'undefined';
        if (isCorrupted && user.phone) {
            const normalized = firestoreService.constructor.normalizePhone(user.phone);
            if (normalized) {
                await firestoreService.updateUser(user.id, { phone_normalized: normalized });
                user.phone_normalized = normalized;
            }
        }

        // Auto-generate QR ID if missing for doctor
        if (user.role === 'doctor' && !user.doctor_qr_id) {
            const newQrId = 'DOC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            await firestoreService.updateUser(user.id, { doctor_qr_id: newQrId });
            user.doctor_qr_id = newQrId;
        }

        const safeUser = { ...user };
        delete safeUser.refresh_token;

        res.json(safeUser);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
};
