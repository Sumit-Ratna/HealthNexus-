import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Stethoscope } from 'lucide-react';

const DoctorLogin = () => {
    const { sendOtp } = useContext(AuthContext);
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleSend = async () => {
        try {
            if (!phoneNumber) {
                alert("Please enter a phone number");
                return;
            }
            const { isNew, success } = await sendOtp(phoneNumber);

            if (success) {
                navigate('/doctor/dashboard');
            } else if (isNew) {
                navigate('/signup', { state: { phone: phoneNumber, role: 'doctor' } });
            }
        } catch (err) {
            console.error("Doctor Login Error:", err);
            alert("Connection Failed. Please check your internet.");
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
                    <Stethoscope color="white" size={32} />
                </div>

                <h1 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Doctor Portal</h1>
                <p style={{ marginBottom: '32px' }}>Secure One-Click Login for Professionals</p>

                <div className="card" style={{ padding: '40px 32px', textAlign: 'left', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label>Registered Phone Number</label>
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
                        Access Dashboard
                    </button>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
                        <span
                            onClick={() => navigate('/login/patient')}
                            style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                            Patient Portal <span style={{ marginLeft: '4px' }}>→</span>
                        </span>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        New Doctor?{' '}
                        <span
                            onClick={() => navigate('/signup', { state: { role: 'doctor', phone: phoneNumber } })}
                            style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Create Doctor Account
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DoctorLogin;
