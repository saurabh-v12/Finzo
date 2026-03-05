import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Star } from 'lucide-react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import Iridescence from '../components/Iridescence';
import './LoginPage.css';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'signin') {
      if (!signInLoaded) return;
      try {
        const result = await signIn.create({
          identifier: formData.email,
          password: formData.password,
        });
        if (result.status === 'complete') {
          localStorage.setItem('finzo_user', formData.email);
          window.location.href = '/';
        }
      } catch (err) {
        alert(err.errors?.[0]?.message || 'Sign in failed');
      }
    } else {
      if (!signUpLoaded) return;
      try {
        const result = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: formData.name,
        });
        if (result.status === 'complete') {
          localStorage.setItem('finzo_user', formData.name);
          window.location.href = '/';
        } else {
          await signUp.prepareEmailAddressVerification();
          setVerifying(true);
        }
      } catch (err) {
        alert(err.errors?.[0]?.message || 'Sign up failed');
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode
      });
      if (result.status === 'complete') {
        window.location.href = '/';
      }
    } catch (err) {
      alert(err.errors?.[0]?.message || 'Invalid code');
    }
  };

  if (verifying) {
    return (
      <div className="login-page-container">
        <div className="login-left-side">
          <div className="login-header">
            <div className="login-logo">Finzo</div>
            <h1 className="login-title">Check Your Email</h1>
            <p className="login-subtitle">
              Enter the 6-digit code we sent you
            </p>
          </div>
          <form className="login-form" onSubmit={handleVerify}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter verification code"
                className="login-input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                style={{paddingLeft: '16px',
                        letterSpacing: '8px',
                        fontSize: '24px',
                        textAlign: 'center'}}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Verify Email
            </button>
            <button 
            type="button" 
            className="google-btn"
            onClick={async () => {
              if (activeTab === 'signin') {
                await signIn.authenticateWithRedirect({
                  strategy: 'oauth_github',
                  redirectUrl: '/sso-callback',
                  redirectUrlComplete: '/'
                });
              } else {
                await signUp.authenticateWithRedirect({
                  strategy: 'oauth_github',
                  redirectUrl: '/sso-callback',
                  redirectUrlComplete: '/'
                });
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Log in with GitHub
          </button>
        </form>
        </div>
        <div className="login-right-side">
          <Iridescence color={[0, 0.8, 1]} mouseReact={true} />
          <div className="glass-bar">© 2026 Finzo.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      {/* LEFT SIDE - Login Form */}
      <div className="login-left-side">
        <div className="login-header">
          <div className="login-logo">
            Finzo<Star size={20} fill="#2563eb" stroke="#2563eb" />
          </div>
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">We Are Happy To See You Again</p>
        </div>

        <div className="login-tabs">
          <button 
            className={`login-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`login-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {activeTab === 'signup' && (
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                name="name"
                placeholder="Full Name" 
                className="login-input"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              className="login-input"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="Password" 
              className="login-input"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" className="login-btn">
            {activeTab === 'signin' ? 'Login' : 'Create Account'}
          </button>

          <div className="divider">OR</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button" 
              className="google-btn"
              onClick={async () => {
                if (activeTab === 'signin') {
                  await signIn.authenticateWithRedirect({
                    strategy: 'oauth_google',
                    redirectUrl: '/sso-callback',
                    redirectUrlComplete: '/'
                  });
                } else {
                  await signUp.authenticateWithRedirect({
                    strategy: 'oauth_google',
                    redirectUrl: '/sso-callback',
                    redirectUrlComplete: '/'
                  });
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Log in with Google
            </button>

            <button 
              type="button" 
              className="google-btn" 
              onClick={async () => { 
                if (activeTab === 'signin') { 
                  await signIn.authenticateWithRedirect({ 
                    strategy: 'oauth_github', 
                    redirectUrl: '/sso-callback', 
                    redirectUrlComplete: '/' 
                  }); 
                } else { 
                  await signUp.authenticateWithRedirect({ 
                    strategy: 'oauth_github', 
                    redirectUrl: '/sso-callback', 
                    redirectUrlComplete: '/' 
                  }); 
                } 
              }} 
            > 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"> 
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/> 
              </svg> 
              Log in with GitHub 
            </button>
          </div>
        </form>


      </div>

      {/* RIGHT SIDE - Iridescence Animation */}
      <div className="login-right-side">
        <Iridescence 
          color={[0, 0.8, 1]} 
          mouseReact={true} 
          amplitude={0.1} 
          speed={0.9} 
        />
        <div className="glass-bar">
          © 2026 Finzo. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
