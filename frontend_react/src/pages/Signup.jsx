
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, User, Calendar, Activity, Briefcase, Building } from 'lucide-react';

const Signup = () => {
    const { sendOtp, register } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial role from navigation state or default to patient
    const initialRole = location.state?.role || 'patient';

    const [step, setStep] = useState(1);
    const [role, setRole] = useState(initialRole);
    const [formData, setFormData] = useState({
        phone: '',
        otp: '',
        name: '',
        dob: '',
        gender: 'Male',
        blood_group: 'O+',
        specialization: '',
        hospital_name: ''
    });

    const [error, setError] = useState('');

    const [confirmationResult, setConfirmationResult] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateAge = (dob) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} Years, ${months} Months, ${days} Days`;
    };

    const handleRegisterDirect = async (e) => {
        e.preventDefault();
        if (!formData.phone || formData.phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        if (!formData.name) {
            setError("Please enter your name");
            return;
        }

        try {
            setError('');
            setStep(2); // Show loading state or processing

            const payload = {
                ...formData,
                role: role,
                otp: '123456' // Bypass backend OTP check
            };

            await register(payload);

            // Redirect based on role
            if (role === 'doctor') {
                navigate('/doctor/dashboard');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error("Registration Error:", err);
            setError(err.response?.data?.error || err.message || "Registration failed. Please check details.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg-color)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        background: 'var(--primary-color)',
                        borderRadius: '12px',
                        margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Activity size={24} />
                    </div>
                    <h1 style={{ color: 'var(--text-primary)' }}>Create your account</h1>
                    <p style={{ marginTop: '8px' }}>Join HealthNexus to manage your care journey</p>
                </div>

                <div className="card" style={{ padding: '32px 24px', textAlign: 'left', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>

                    {error && (
                        <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '20px', background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegisterDirect}>
                        <div style={{ marginBottom: '20px' }}>
                            <label>Mobile Number *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '44px' }}
                                />
                                <Phone size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label>Full Name *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '44px' }}
                                />
                                <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ marginBottom: '10px' }}>I am a...</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRole('patient')}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        border: role === 'patient' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                        background: role === 'patient' ? 'var(--primary-light)' : 'white',
                                        color: role === 'patient' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('doctor')}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        border: role === 'doctor' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                        background: role === 'doctor' ? 'var(--primary-light)' : 'white',
                                        color: role === 'doctor' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Doctor
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label>Date of Birth</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '44px' }}
                                    />
                                    <Calendar size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                            <div>
                                <label>Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Doctor Specific Fields */}
                        {role === 'doctor' && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label>Specialization *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            name="specialization"
                                            placeholder="e.g. Cardiologist"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            required={role === 'doctor'}
                                            style={{ paddingLeft: '44px' }}
                                        />
                                        <Briefcase size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label>Hospital / Clinic *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            name="hospital_name"
                                            placeholder="e.g. City Hospital"
                                            value={formData.hospital_name}
                                            onChange={handleChange}
                                            required={role === 'doctor'}
                                            style={{ paddingLeft: '44px' }}
                                        />
                                        <Building size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Patient Specific Fields */}
                        {role === 'patient' && (
                            <div style={{ marginBottom: '20px' }}>
                                <label>Blood Group</label>
                                <select
                                    name="blood_group"
                                    value={formData.blood_group}
                                    onChange={handleChange}
                                >
                                    <option>O+</option>
                                    <option>O-</option>
                                    <option>A+</option>
                                    <option>A-</option>
                                    <option>B+</option>
                                    <option>B-</option>
                                    <option>AB+</option>
                                    <option>AB-</option>
                                </select>
                            </div>
                        )}

                        <button type="submit" className="btn-primary">
                            Complete Registration
                        </button>

                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                            <span
                                onClick={() => navigate('/login')}
                                style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Log in
                            </span>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
