import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, CheckCircle, AlertCircle, Users } from 'lucide-react';
import '../styles/Login.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'CITIZEN',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [step, setStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      value: 'CITIZEN',
      title: 'Citizen',
      description: 'Report e-waste and schedule pickups',
      icon: <Users size={24} />
    },
    {
      value: 'WASTE_COLLECTOR',
      title: 'Waste Collector',
      description: 'Collect and manage e-waste pickups',
      icon: <Briefcase size={24} />
    }
  ];

  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 10 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'medium';
    return 'strong';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const validateStep = () => {
    if (step === 1) {
      return formData.email && formData.username && formData.first_name && formData.last_name;
    }
    if (step === 2) {
      return formData.role;
    }
    if (step === 3) {
      return formData.password && formData.password_confirm && formData.password === formData.password_confirm;
    }
    return false;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength === 'weak') {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        // Show success message and redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(
          typeof result.error === 'string'
            ? result.error
            : 'Registration failed. Please try again.'
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Create Account</h2>
          <p>Join our team management system</p>
          
          {/* Progress indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step >= stepNum 
                    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                    : '#e2e8f0',
                  color: step >= stepNum ? 'white' : '#718096',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {stepNum}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading && (
          <div className="success-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} />
            Account created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-input"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    placeholder="johndoe"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="form-input"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    placeholder="John"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="form-input"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <button type="button" onClick={nextStep} className="btn-primary">
                Next Step
              </button>
            </div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#4a5568', fontWeight: '600' }}>
                  Select Your Role
                </label>
                <div className="role-selector">
                  {roles.map((role) => (
                    <div key={role.value} className="role-option">
                      <input
                        type="radio"
                        id={role.value}
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={() => handleRoleChange(role.value)}
                      />
                      <label htmlFor={role.value} className="role-label">
                        <div className="role-icon">
                          {role.icon}
                        </div>
                        <div className="role-title">{role.title}</div>
                        <div className="role-description">{role.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="btn-primary" 
                  style={{ 
                    background: '#e2e8f0', 
                    color: '#4a5568',
                    flex: '1'
                  }}
                >
                  Previous
                </button>
                <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: '1' }}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Password Setup */}
          {step === 3 && (
            <div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#a0aec0'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="password-strength">
                    <div 
                      className={`password-strength-bar password-strength-${passwordStrength}`}
                    />
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>
                  Password strength: {passwordStrength}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password_confirm">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#a0aec0'
                    }} 
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="password_confirm"
                    name="password_confirm"
                    className="form-input"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#a0aec0'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password_confirm && formData.password !== formData.password_confirm && (
                  <div style={{ color: '#fc8181', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="btn-primary" 
                  style={{ 
                    background: '#e2e8f0', 
                    color: '#4a5568',
                    flex: '1'
                  }}
                >
                  Previous
                </button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: '1' }}>
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="auth-link">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
