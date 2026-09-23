import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticationWorld } from '../components/three/AuthenticationWorld';

interface AuthSceneProps {
  initialMode: 'login' | 'register';
}

export const AuthScene: React.FC<AuthSceneProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const [isEnteringPortal, setIsEnteringPortal] = useState(false);

  const handleLoginSuccess = () => {
    setIsEnteringPortal(true);
  };

  const handleTransitionComplete = () => {
    navigate('/garage', { replace: true });
  };

  return (
    <AuthenticationWorld
      mode={initialMode}
      isEnteringPortal={isEnteringPortal}
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={() => navigate('/register')}
      onSwitchToLogin={() => navigate('/login')}
      onRegisterSuccess={() => navigate('/login')}
      onTransitionComplete={handleTransitionComplete}
    />
  );
};
