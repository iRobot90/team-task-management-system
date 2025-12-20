import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api/password';
import './Auth.css';

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const response = await requestPasswordReset(email, reason);

        if (response.success) {
            setResult(response.data);
        } else {
            setError(response.error);
        }

        setLoading(false);
    };

    if (result) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>✓ Request Submitted</h2>
                    <div className="success-message">
                        <p>{result.message}</p>
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                            <strong>Request ID:</strong> {result.request_id}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>
                            Your password reset request is pending admin approval. You will be notified once it has been reviewed.
                        </p>
                    </div>
                    <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
                    Submit a password reset request. An administrator will review and approve your request.
                </p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder=" your registered email"
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason">Reason (Optional)</label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            placeholder="Why do you need to reset your password?"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Request Password Reset'}
                    </button>
                </form>

                <p className="auth-link">
                    Remember your password? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default PasswordReset;
