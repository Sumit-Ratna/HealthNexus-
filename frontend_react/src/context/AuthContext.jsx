import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

    const baseUrl = import.meta.env.VITE_API_URL || 'https://healthnexus-c3sa.onrender.com';

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${baseUrl}/api/auth/me`, { timeout: 10000 });
            setUser(res.data);
        } catch (err) {
            console.error("Auth Check Failed", err);
            localStorage.removeItem('accessToken');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const sendOtp = async (phone) => {
        try {
            const res = await axios.post(`${baseUrl}/api/auth/otp/send`, { phone }, { timeout: 10000 });
            const { isNew, accessToken, user } = res.data;

            if (accessToken && user) {
                localStorage.setItem('accessToken', accessToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                setUser(user);
                return { isNew: false, success: true };
            }

            return { isNew: isNew || true, success: false };
        } catch (err) {
            console.error("Direct Login/Check Error:", err);
            throw err;
        }
    };

    const register = async (userData) => {
        const res = await axios.post(`${baseUrl}/api/auth/register`, {
            ...userData,
            otp: '123456'
        }, { timeout: 10000 });
        const { accessToken, user } = res.data;

        localStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(user);

        return user;
    };

    const deleteAccount = async () => {
        await axios.delete(`${baseUrl}/api/profile/delete`, { timeout: 10000 });
        logout();
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, loading, sendOtp, register, logout, deleteAccount, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
