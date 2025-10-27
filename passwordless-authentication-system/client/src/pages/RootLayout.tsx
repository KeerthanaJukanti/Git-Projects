import { Routes, Route, Link, useLocation } from 'react-router-dom';
import MagicLinkLogin from './MagicLinkLogin';
import Signup from './Signup';
import UserDashboard from './UserDashboard';
import { useState, useEffect } from 'react';
import securityPattern from '../assets/images/security-pattern.svg';

// Types
interface User {
  user: {
    sub: string;
    iat: number;
    exp: number;
    email?: string;
  };
}

/**
 * Main App component with routing
 * Provides navigation and route handling for the passwordless auth system
 */
export default function App() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  
  // Determine which navigation buttons to show based on current route
  const showRegisterOnly = location.pathname === '/';
  const showLoginOnly = location.pathname === '/signup';
  const showNoButtons = location.pathname === '/dashboard';

  // Fetch user data when on dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      fetchUser();
    }
  }, [location.pathname]);

  /**
   * Fetches user information from the server
   */
  async function fetchUser(): Promise<void> {
    try {
      const response = await fetch('/me', { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        // Try to refresh the token
        const refreshResponse = await fetch('/auth/refresh', { 
          method: 'POST', 
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!refreshResponse.ok) {
          return;
        }
        
        // Retry fetching user data
        const retryResponse = await fetch('/me', { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (retryResponse.ok) {
          const userData: User = await retryResponse.json();
          setUser(userData);
        }
      } else if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }

  /**
   * Logs out the user and redirects to login page
   */
  async function logout(): Promise<void> {
    try {
      await fetch('/auth/logout', { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout request fails
      window.location.href = '/';
    }
  }

  const getDisplayName = (user: any) => {
    // Extract username from email if available
    if (user.email) {
      const username = user.email.split('@')[0];
      // Capitalize first letter and make it look nice
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    
    // If no email, use a friendly name based on the user ID
    const names = [
      'Alex Johnson',
      'Sarah Chen', 
      'Michael Rodriguez',
      'Emily Davis',
      'David Kim',
      'Lisa Wang',
      'James Wilson',
      'Maria Garcia',
      'John Smith',
      'Anna Taylor'
    ];
    
    // Use the user ID to consistently pick a name
    const hash = user.sub.split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return names[Math.abs(hash) % names.length];
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      backgroundImage: `url(${securityPattern})`,
      backgroundSize: '200px 200px',
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        backgroundImage: `url(${securityPattern})`,
        backgroundSize: '1500px 1500px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backdropFilter: 'blur(20px)',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '28px',
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              cursor: 'default'
            }}
          >
            Passwordless Authentication System
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Show Register button only on login page */}
            {showRegisterOnly && (
              <Link 
                to="/signup" 
                style={{ 
                  textDecoration: 'none', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                Register
          </Link>
            )}
            
            {/* Show Login button only on signup page */}
            {showLoginOnly && (
            <Link 
              to="/" 
              style={{ 
                textDecoration: 'none', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                Login
            </Link>
            )}
            
            {/* Show welcome message and logout on dashboard */}
            {location.pathname === '/dashboard' && user && (
              <>
                <span style={{
                  color: '#888888',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Welcome, {getDisplayName(user.user)}
                </span>
                <button
                  onClick={logout}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
                  }}
                >
                  Log Out
                </button>
              </>
            )}

            {/* No buttons shown on dashboard page */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '40px 24px',
        minHeight: 'auto'
      }}>
        <Routes>
          <Route path="/" element={<MagicLinkLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<UserDashboard />} />
        </Routes>
      </main>
    </div>
  );
}