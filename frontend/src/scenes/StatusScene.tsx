import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHealth } from '../services/api';
import { HealthStatus } from '../types/health';
import {
  Activity,
  Database,
  Server,
  Monitor,
  RefreshCw,
  Clock,
  Cpu,
  ArrowLeft,
} from 'lucide-react';

export const StatusScene: React.FC = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('-');
  const [latency, setLatency] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const checkHealthStatus = useCallback(async () => {
    const startTime = performance.now();
    try {
      const data = await fetchHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setHealth({
        status: 'DOWN',
        api: 'DOWN',
        database: 'DOWN',
        message: 'Failed to query API',
      });
      setLatency(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealthStatus();
    if (!autoRefresh) return;
    const interval = setInterval(checkHealthStatus, 2500);
    return () => clearInterval(interval);
  }, [checkHealthStatus, autoRefresh]);

  const isApiConnected = health?.api === 'UP';
  const isDbConnected = health?.database === 'UP';

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 24px',
        width: '100%',
        fontFamily: 'var(--font-family)',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={16} /> Back to 3D Authentication
        </button>
      </div>

      <header
        style={{
          marginBottom: '40px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            padding: '6px 18px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--accent-cyan)',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          <Cpu size={15} />
          Infrastructure Diagnostic
        </div>

        <h1
          style={{
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}
        >
          EVShare 3D
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Intelligent Web 3D Platform for Electric Vehicle Co-ownership Management and Operations.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '36px',
        }}
      >
        {/* Frontend Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Monitor size={26} />
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-green)',
                    boxShadow: '0 0 8px var(--accent-green)',
                  }}
                ></span>
                CONNECTED
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Frontend
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              React 18 + Vite + TypeScript (Pure 3D UI Engine)
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Host: localhost:5173</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Active</span>
          </div>
        </div>

        {/* Spring Boot API Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isApiConnected ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isApiConnected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isApiConnected ? 'var(--accent-blue)' : 'var(--accent-red)',
                }}
              >
                <Server size={26} />
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: isApiConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isApiConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${isApiConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isApiConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                    boxShadow: `0 0 8px ${isApiConnected ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                  }}
                ></span>
                {isApiConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              Spring Boot API
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Spring Boot 3.3.4 (Java 21/25) REST Backend & Actuator
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Endpoint: /api/health</span>
            <span style={{ color: isApiConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isApiConnected ? `${latency ?? 0}ms` : 'Down'}
            </span>
          </div>
        </div>

        {/* MySQL Database Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isDbConnected ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isDbConnected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDbConnected ? 'var(--accent-cyan)' : 'var(--accent-red)',
                }}
              >
                <Database size={26} />
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: isDbConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isDbConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${isDbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isDbConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                    boxShadow: `0 0 8px ${isDbConnected ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                  }}
                ></span>
                {isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
              MySQL
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              MySQL 8.0+ Community Server / Docker (Database: evshare3d)
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Flyway: Migrations Active</span>
            <span style={{ color: isDbConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isDbConnected ? 'Validated' : 'Unreachable'}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={checkHealthStatus}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            Refresh Probe
          </button>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Live Polling (2.5s)
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} />
            Last Probe: <strong style={{ color: 'var(--text-primary)' }}>{lastChecked}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} />
            Latency: <strong style={{ color: 'var(--text-primary)' }}>{latency !== null ? `${latency} ms` : '-'}</strong>
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(8, 11, 17, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#e2e8f0',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '16px',
            borderRadius: '8px',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  );
};
