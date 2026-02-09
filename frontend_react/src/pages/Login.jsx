import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Fingerprint, CreditCard } from 'lucide-react';

const Login = () => {
    const { sendOtp } = useContext(AuthContext);
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    const handleSend = async () => {
        const targetUrl = "https://healthnexus-c3sa.onrender.com/api/auth/otp/send";
        try {
            if (!phoneNumber) {
                alert("Please enter a phone number");
                return;
            }
            // sendOtp now handles direct login if the user exists
            const { isNew, success } = await sendOtp(phoneNumber);

            if (success) {
                // User logged in directly
                navigate('/home');
            } else if (isNew) {
                // User doesn't exist, redirect to signup/profile setup
                setIsNewUser(true);
                navigate('/profile-setup');
            }
        } catch (err) {
            console.error("Login Error Details:", err);
            const detail = err.response ? `Status: ${err.response.status}` : (err.request ? "No response from server (Check CORS/SSL)" : err.message);
            alert(`CONNECTION FAILED!\nTarget: ${targetUrl}\nIssue: ${detail}\n\nTIP: Check if your computer date/time (2025) is correct!`);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg-color)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}
            >
                <div style={{
                    width: '64px', height: '64px',
                    background: 'var(--primary-color)',
                    borderRadius: '16px',
                    margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.4)'
                }}>
                    <Fingerprint color="white" size={32} />
                </div>

                <h1 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Welcome Back</h1>
                <p style={{ marginBottom: '32px' }}>Sign in directly with your phone number</p>

                <div className="card" style={{ padding: '40px 32px', textAlign: 'left', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                style={{ paddingLeft: '44px' }}
                            />
                            <Phone size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleSend}>
                        Secure One-Click Login
                    </button>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <button className="btn-outline" style={{ fontSize: '13px', padding: '10px' }}>
                            <CreditCard size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Login via PAN
                        </button>
                        <button className="btn-outline" style={{ fontSize: '13px', padding: '10px' }}>
                            <Fingerprint size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Biometric
                        </button>
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <span
                            onClick={() => navigate('/signup')}
                            style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Create account
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
