import React, { useState, useEffect } from 'react';
import { usePWA } from '../utils/pwa';

const PWAInstallPrompt = () => {
  const { 
    isInstallPromptAvailable, 
    showInstallPrompt, 
    isPWAInstalled,
    isOnline 
  } = usePWA();
  
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show install prompt if available and not already installed
    if (isInstallPromptAvailable && !isPWAInstalled && !dismissed) {
      setShowBanner(true);
    }
  }, [isInstallPromptAvailable, isPWAInstalled, dismissed]);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if dismissed recently (24 hours)
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const timeSinceeDismissal = Date.now() - parseInt(dismissedTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (timeSinceeDismissal < twentyFourHours) {
        setDismissed(true);
      } else {
        localStorage.removeItem('pwa-prompt-dismissed');
      }
    }
  }, []);

  if (!showBanner || isPWAInstalled) {
    return null;
  }

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.icon}>📱</div>
        <div style={styles.text}>
          <h4 style={styles.title}>Install Portfolio App</h4>
          <p style={styles.description}>
            Get quick access with offline support and push notifications
          </p>
        </div>
        <div style={styles.actions}>
          <button 
            onClick={handleInstall}
            style={{...styles.button, ...styles.installButton}}
          >
            Install
          </button>
          <button 
            onClick={handleDismiss}
            style={{...styles.button, ...styles.dismissButton}}
          >
            ✕
          </button>
        </div>
      </div>
      {!isOnline && (
        <div style={styles.offlineIndicator}>
          <span style={styles.offlineDot}></span>
          Offline Mode
        </div>
      )}
    </div>
  );
};

const styles = {
  banner: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    right: '20px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
    maxWidth: '400px',
    margin: '0 auto',
    backdropFilter: 'blur(10px)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
  },
  icon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: 'white',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  description: {
    margin: 0,
    fontSize: '14px',
    color: '#a8a8a8',
    lineHeight: '1.4',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  button: {
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '8px 16px',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      transform: 'translateY(-1px)',
    },
  },
  dismissButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#a8a8a8',
    padding: '8px',
    width: '32px',
    height: '32px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
    },
  },
  offlineIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '12px',
    color: '#ffa500',
    background: 'rgba(255, 165, 0, 0.1)',
  },
  offlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ffa500',
    animation: 'pulse 2s infinite',
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default PWAInstallPrompt;