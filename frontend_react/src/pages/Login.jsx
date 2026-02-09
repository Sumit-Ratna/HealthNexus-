import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Fingerprint, CreditCard } from 'lucide-react';

const Login = () => {
    const { sendOtp, verifyOtp } = useContext(AuthContext);
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    const [confirmationResult, setConfirmationResult] = useState(null);

    const handleSend = async () => {
        const targetUrl = "https://healthnexus-c3sa.onrender.com/api/auth/otp/send";
        try {
            if (!phoneNumber) {
                alert("Please enter a phone number");
                return;
            }
            const { isNew } = await sendOtp(phoneNumber);
            // setIsNewUser(isNew || false); // Backend logic decides, usually we just proceed to OTP
            // Actually, in current flow we just need to know if we should redirect later?
            // The isNew logic was for visual clues, but critical logic is in verifyOtp response (which returns user or 404).
            // But wait, getOtp returns isNew.
            setIsNewUser(isNew);
            setStep(2);
            // Auto-fill OTP for convenience
            setOtp('123456');
        } catch (err) {
            console.error("Login Error Details:", err);
            const detail = err.response ? `Status: ${err.response.status}` : (err.request ? "No response from server (Check CORS/SSL)" : err.message);
            alert(`CONNECTION FAILED!\nTarget: ${targetUrl}\nIssue: ${detail}\n\nTIP: Check if your computer date/time is correct! (Current: 2026)`);
        }
    };

    const handleVerify = async () => {
        try {
            if (!confirmationResult) throw new Error("Please request OTP first");

            await verifyOtp(confirmationResult, otp, phoneNumber, 'patient');

            // Redirect new users to profile setup
            if (isNewUser) {
                navigate('/profile-setup');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Invalid OTP");
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
                <p style={{ marginBottom: '32px' }}>Sign in to your HealthNexus account</p>

                <div className="card" style={{ padding: '40px 32px', textAlign: 'left', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                    {step === 1 ? (
                        <>
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

                            {/* Recaptcha Removed for Fixed OTP */}

                            <button className="btn-primary" onClick={handleSend}>
                                Check Availability & Send OTP
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
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '24px' }}>
                                <label>Enter Verification Code</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="1 2 3 4 5 6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        style={{ paddingLeft: '44px', letterSpacing: '4px', fontWeight: '600' }}
                                    />
                                    <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                                    Code sent to {phoneNumber}. <span onClick={() => setStep(1)} style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>Change</span>
                                </p>
                            </div>

                            <button className="btn-primary" onClick={handleVerify}>Verify & Secure Login</button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
