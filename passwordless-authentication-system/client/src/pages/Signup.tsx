import { useState } from 'react';
import { Link } from 'react-router-dom';

// Types
type Status = 'idle' | 'loading' | 'sent' | 'error';

interface SignupResponse {
  ok: boolean;
  error?: string;
}

/**
 * Signup component for passwordless authentication
 * Allows users to register and receive a magic link for first-time login
 */
export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: ''
  });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  /**
   * Handles form input changes
   */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  /**
   * Registers a new user and sends a magic link for first-time login
   */
  async function handleSignup(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || 
        !formData.username.trim() || !formData.email.trim()) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim()
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create account';
        try {
          const errorData: SignupResponse = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setStatus('sent');
      setMessage('Account created successfully! Check your email for the magic link to complete your registration.');
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Error creating account';
      setMessage(errorMessage);
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '70vh',
      padding: '40px 20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '40px 40px 24px 40px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ 
            textAlign: 'center', 
            margin: 0,
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ✨ Create Your Account
          </h3>
          <p style={{
            textAlign: 'center',
            margin: '12px 0 0 0',
            color: '#888888',
            fontSize: '16px',
            fontWeight: '400'
          }}>
            Join us and experience passwordless authentication
          </p>
        </div>
        <div style={{ padding: '40px' }}>
          <form onSubmit={handleSignup}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <label 
                  htmlFor="firstName" 
                  style={{ 
                    display: 'block',
                    marginBottom: '12px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  type="text"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="Enter your first name"
                  required
                  disabled={status === 'loading'}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>
              <div>
                <label 
                  htmlFor="lastName" 
                  style={{ 
                    display: 'block',
                    marginBottom: '12px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  type="text"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="Enter your last name"
                  required
                  disabled={status === 'loading'}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="username" 
                style={{ 
                  display: 'block',
                  marginBottom: '12px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                type="text"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Choose a username"
                required
                disabled={status === 'loading'}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <label 
                htmlFor="email" 
                style={{ 
                  display: 'block',
                  marginBottom: '12px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Enter your email address"
                required
                disabled={status === 'loading'}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>
            
            <div>
              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: status === 'loading' 
                    ? 'linear-gradient(135deg, #666 0%, #555 100%)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: status === 'loading' ? 0.7 : 1,
                  boxShadow: status === 'loading' 
                    ? 'none' 
                    : '0 8px 20px rgba(102, 126, 234, 0.3)',
                  transform: status === 'loading' ? 'none' : 'translateY(0)'
                }}
                disabled={status === 'loading'}
                onMouseEnter={(e) => {
                  if (status !== 'loading') {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (status !== 'loading') {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {status === 'loading' ? 'Creating Account…' : 'Create Account'}
              </button>
            </div>
          </form>
          
          {message && (
            <div 
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: status === 'error' 
                  ? 'rgba(255, 107, 107, 0.1)' 
                  : 'rgba(74, 222, 128, 0.1)',
                border: `2px solid ${status === 'error' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`,
                color: status === 'error' ? '#ff6b6b' : '#4ade80',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)'
              }}
            >
              {message}
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ margin: 0, color: '#888888', fontSize: '15px' }}>
              Already have an account? <Link to="/" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.3s ease'
              }}>Sign in here</Link>
            </p>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ 
              margin: 0, 
              color: '#888888', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Passwordless Authentication System - Secure, Simple, Fast
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
