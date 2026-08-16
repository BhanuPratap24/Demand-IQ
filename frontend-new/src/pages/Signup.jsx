import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../App.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        city: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.full_name || !formData.email || !formData.password) {
            setError('Please fill all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await authAPI.signup({
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                city: formData.city,
                address: formData.address
            });
            
            if (response.data.success) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.customer));
                
                // Redirect to dashboard
                navigate('/dashboard');
            } else {
                setError(response.data.message || 'Signup failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <h1>📝 Join DemandIQ</h1>
                <p style={styles.subtitle}>Create your account to get started</p>
                
                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSignup} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            disabled={loading}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Mumbai"
                            disabled={loading}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={styles.link}>
                    Already have an account? <a href="/login">Login here</a>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
    },
    formBox: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '500px'
    },
    subtitle: {
        color: '#6b7280',
        marginTop: '5px'
    },
    form: {
        marginTop: '20px'
    },
    formGroup: {
        marginBottom: '15px'
    },
    submitBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px'
    },
    link: {
        textAlign: 'center',
        marginTop: '15px',
        color: '#6b7280'
    }
};
