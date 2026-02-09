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
            const res = await axios.get(`https://healthnexus-c3sa.onrender.com/api/auth/me`);
            setUser(res.data);
        } catch (err) {
            console.error("Auth Check Failed", err);
            localStorage.removeItem('accessToken');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    // -> Recaptcha Removed for Fixed OTP Flow

    const sendOtp = async (phone) => {
        try {
            // 1. Check User Status with Backend - Hardcoded URL for reliability
            const res = await axios.post(`https://healthnexus-c3sa.onrender.com/api/auth/otp/send`, { phone });
            const { isNew } = res.data;

            console.log(`[DEV] Fixed OTP Mode. User exists: ${!isNew}`);
            // In a real app, backend would send SMS here. 
            // For now, we assume user knows '123456'.

            return { isNew };
        } catch (err) {
            console.error("OTP Send Error:", err);
            throw err;
        }
    };

    const verifyOtp = async (confirmationResult_ignored, otp, phone, expectedRole = 'patient') => {
        // 1. Skip Firebase Verification

        // 2. Login with Backend using Fixed OTP - Hardcoded URL for reliability
        const res = await axios.post(`https://healthnexus-c3sa.onrender.com/api/auth/otp/verify`, {
            phone,
            otp, // Sending OTP instead of firebaseToken
            role: expectedRole
        });

        const { accessToken, user } = res.data;

        localStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);

        return user;
    };

    const register = async (userData, firebaseToken_ignored) => {
        // userData: { phone, role, name, etc. }
        // We inject otp '123456' to bypass backend check
        // hardcoded URL for reliability
        const res = await axios.post(`https://healthnexus-c3sa.onrender.com/api/auth/register`, {
            ...userData,
            otp: '123456'
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
