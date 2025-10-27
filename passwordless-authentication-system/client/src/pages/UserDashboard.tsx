import { useEffect, useState } from 'react';
import { userApi, authApi } from '../utils/api';

// Types
interface User {
  user: {
    sub: string;
    iat: number;
    exp: number;
    email?: string;
  };
}

interface ApiResponse {
  ok?: boolean;
  error?: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
  client: string;
}

interface Metric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

/**
 * Modern Dashboard component inspired by Accelo's project management interface
 * Features real-time project tracking, metrics, and professional design
 */
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'resources' | 'financial'>('overview');

  // Mock data for demonstration (in a real app, this would come from API)
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Website Redesign',
      status: 'active',
      progress: 75,
      budget: 15000,
      spent: 11250,
      deadline: '2025-11-15',
      client: 'TechCorp Inc.'
    },
    {
      id: '2',
      name: 'Mobile App Development',
      status: 'active',
      progress: 45,
      budget: 25000,
      spent: 8750,
      deadline: '2025-12-20',
      client: 'StartupXYZ'
    },
    {
      id: '3',
      name: 'E-commerce Platform',
      status: 'completed',
      progress: 100,
      budget: 20000,
      spent: 18500,
      deadline: '2025-10-10',
      client: 'RetailPlus'
    },
    {
      id: '4',
      name: 'Data Analytics Dashboard',
      status: 'on-hold',
      progress: 30,
      budget: 12000,
      spent: 3600,
      deadline: '2025-11-30',
      client: 'DataFlow Systems'
    }
  ];

  const mockMetrics: Metric[] = [
    { label: 'Active Projects', value: 2, change: 12, trend: 'up' },
    { label: 'Total Revenue', value: '$67,500', change: 8, trend: 'up' },
    { label: 'Team Utilization', value: '87%', change: -3, trend: 'down' },
    { label: 'On-Time Delivery', value: '94%', change: 5, trend: 'up' }
  ];

  /**
   * Fetches user information from the server
   * Handles token refresh automatically if needed
   */
  async function fetchUser(): Promise<void> {
    try {
      setLoading(true);
      setError('');

      try {
        const userData: User = await userApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // If 401, try to refresh the token
        if (error instanceof Error && error.message.includes('401')) {
          try {
            await authApi.refreshToken();
            const userData: User = await userApi.getCurrentUser();
            setUser(userData);
          } catch (refreshError) {
            throw new Error('Session expired. Please sign in again.');
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Logs out the user and redirects to login page
   */
  async function logout(): Promise<void> {
    try {
      await authApi.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout request fails
      window.location.href = '/';
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#6c757d';
      case 'on-hold': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ 
            color: '#ffffff', 
            fontSize: '18px',
            fontWeight: '500',
            margin: 0
          }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '40px'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          color: '#ff6b6b',
          border: '2px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '16px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px'
      }}>
        <p style={{ 
          fontSize: '18px', 
          color: '#ffffff',
          marginBottom: '24px',
          fontWeight: '500'
        }}>
          No user data available
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: 'rgba(15, 15, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0 32px'
      }}>
        <div style={{ display: 'flex', gap: '40px' }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'projects', label: 'Projects' },
            { key: 'resources', label: 'Resources' },
            { key: 'financial', label: 'Financial' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '20px 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab.key ? '#667eea' : '#888888',
                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.key ? '600' : '500',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '0' }}>
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {mockMetrics.map((metric, index) => (
                <div key={index} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '32px',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '15px', 
                        color: '#888888',
                        fontWeight: '500'
                      }}>
                        {metric.label}
                      </p>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#ffffff',
                        letterSpacing: '-0.5px'
                      }}>
                        {metric.value}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: metric.trend === 'up' ? '#4ade80' : metric.trend === 'down' ? '#ff6b6b' : '#888888',
                      backgroundColor: metric.trend === 'up' ? 'rgba(74, 222, 128, 0.1)' : 
                                      metric.trend === 'down' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(136, 136, 136, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${metric.trend === 'up' ? 'rgba(74, 222, 128, 0.3)' : 
                                        metric.trend === 'down' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(136, 136, 136, 0.3)'}`
                    }}>
                      <span>{getTrendIcon(metric.trend)}</span>
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Project Overview */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)'
            }}>
              <h2 style={{ 
                margin: '0 0 32px 0', 
                fontSize: '24px', 
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: '-0.5px'
              }}>
                Project Overview
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px'
              }}>
                {mockProjects.slice(0, 2).map(project => (
                  <div key={project.id} style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
                        {project.name}
                      </h3>
                      <span style={{ 
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: getStatusColor(project.status) === '#28a745' ? 'rgba(74, 222, 128, 0.1)' : 
                                        getStatusColor(project.status) === '#ffc107' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(136, 136, 136, 0.1)',
                        color: getStatusColor(project.status) === '#28a745' ? '#4ade80' : 
                               getStatusColor(project.status) === '#ffc107' ? '#ffc107' : '#888888',
                        border: `1px solid ${getStatusColor(project.status) === '#28a745' ? 'rgba(74, 222, 128, 0.3)' : 
                                        getStatusColor(project.status) === '#ffc107' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(136, 136, 136, 0.3)'}`
                      }}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>
                      {project.client}
                    </p>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#888888', fontWeight: '500' }}>Progress</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{project.progress}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${project.progress}%`,
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#888888', fontWeight: '500' }}>
                      <span>Budget: {formatCurrency(project.budget)}</span>
                      <span>Spent: {formatCurrency(project.spent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ 
              margin: '0 0 32px 0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.5px'
            }}>
              All Projects
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Project</th>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Client</th>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Progress</th>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Budget</th>
                    <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '14px', fontWeight: '600', color: '#888888' }}>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {mockProjects.map(project => (
                    <tr key={project.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '20px 0', fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                        {project.name}
                      </td>
                      <td style={{ padding: '20px 0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>
                        {project.client}
                      </td>
                      <td style={{ padding: '20px 0' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: getStatusColor(project.status) === '#28a745' ? 'rgba(74, 222, 128, 0.1)' : 
                                          getStatusColor(project.status) === '#ffc107' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(136, 136, 136, 0.1)',
                          color: getStatusColor(project.status) === '#28a745' ? '#4ade80' : 
                                 getStatusColor(project.status) === '#ffc107' ? '#ffc107' : '#888888',
                          border: `1px solid ${getStatusColor(project.status) === '#28a745' ? 'rgba(74, 222, 128, 0.3)' : 
                                          getStatusColor(project.status) === '#ffc107' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(136, 136, 136, 0.3)'}`
                        }}>
                          {project.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '20px 0', fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>
                        {project.progress}%
                      </td>
                      <td style={{ padding: '20px 0', fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>
                        {formatCurrency(project.budget)}
                      </td>
                      <td style={{ padding: '20px 0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>
                        {new Date(project.deadline).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ 
              margin: '0 0 32px 0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.5px'
            }}>
              Resource Management
            </h2>
            <p style={{ 
              color: '#888888', 
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              Resource management features coming soon. This would include team utilization, 
              capacity planning, and resource allocation tools.
            </p>
          </div>
        )}

        {activeTab === 'financial' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ 
              margin: '0 0 32px 0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.5px'
            }}>
              Financial Overview
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 24px',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>
                  {formatCurrency(72000)}
                </h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>Total Revenue</p>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 24px',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '700', color: '#ff6b6b' }}>
                  {formatCurrency(45000)}
                </h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>Total Expenses</p>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 24px',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '700', color: '#667eea' }}>
                  {formatCurrency(27000)}
                </h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#888888', fontWeight: '500' }}>Net Profit</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
