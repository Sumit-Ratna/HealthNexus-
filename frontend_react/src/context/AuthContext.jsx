import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }

        // Global Axios Interceptor for 401 errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.warn("Session expired or unauthorized. Logging out...");
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com'}/api/auth/me`);
            setUser(res.data);
        } catch (err) {
            console.error("Auth Check Failed", err);
            localStorage.removeItem('accessToken');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const setupRecaptcha = (elementId) => {
        // 1. Clear existing verifier session
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.warn("Recaptcha clear error:", e);
            }
            window.recaptchaVerifier = null;
        }

        // 2. Clear visual DOM artifacts (Simpler, safer approach)
        //->      // const container = document.getElementById(elementId);
        // if (container) {
        //     container.innerHTML = '';
        // }

        // 3. Init new verifier
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                'size': 'invisible',
                'callback': () => console.log("Recaptcha Verified")
            });
        } catch (err) {
            console.error("Recaptcha Init Error:", err);
            throw err;
        }
    };

    //->    // const sendOtp = async (phone, recaptchaContainerId = 'recaptcha-container') => {
    const sendOtp = async (phone, recaptchaContainerId = 'recaptcha-login') => {
        try {
            // 1. Initialize Recaptcha FIRST (Fixes "black screen" or race condition)
            setupRecaptcha(recaptchaContainerId);
            const appVerifier = window.recaptchaVerifier;

            if (!appVerifier) {
                throw new Error("Recaptcha verification failed to initialize. Please refresh.");
            }

            //->        // Explicitly wait for render (catch render errors early)
            // const widgetId = await appVerifier.render();
            // console.log(`✅ Recaptcha rendered successfully. Widget ID: ${widgetId}`);

            // 2. Check User Status with Backend
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com'}/api/auth/otp/send`, { phone });
            const { isNew } = res.data;

            // 3. Send Firebase OTP
            let formattedPhone = phone;
            if (!phone.startsWith('+')) formattedPhone = '+91' + phone;

            console.log(`🔥 Sending OTP to ${formattedPhone}`);
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            return { confirmationResult, isNew };
        } catch (err) {
            console.error("OTP Send Error:", err);
            // Propagate standard JS error for frontend to catch
            throw err;
        }
    };

    const verifyOtp = async (confirmationResult, otp, phone, expectedRole = 'patient') => {
        // 1. Verify with Firebase
        const result = await confirmationResult.confirm(otp);
        const firebaseUser = result.user;
        const idToken = await firebaseUser.getIdToken();

        console.log("🔥 Firebase Auth Success. Token:", idToken);

        // 2. Login with Backend using Token
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com'}/api/auth/otp/verify`, {
            phone,
            firebaseToken: idToken,
            role: expectedRole
        });

        const { accessToken, user } = res.data;

        localStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);

        return user;
    };

    const register = async (userData, firebaseToken) => {
        // userData: { phone, role, name, etc. }
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com'}/api/auth/register`, {
            ...userData,
            firebaseToken
        });
        const { accessToken, user } = res.data;

        localStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);

        return user;
    };

    const deleteAccount = async () => {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com'}/api/profile/delete`);
        logout();
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, register, logout, deleteAccount, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
