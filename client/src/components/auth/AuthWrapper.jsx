import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ThemeToggle from '../../utils/ThemeToggle';

const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="relative">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="transition-all duration-500 ease-in-out">
        {isLogin ? (
          <div className="animate-fade-in">
            <Login onSwitchToRegister={switchToRegister} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <Register onSwitchToLogin={switchToLogin} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthWrapper;