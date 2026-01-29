import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { LoginForm } from "@/components/Auth/LoginForm";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { useAuth } from "@/components/Auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const Index = () => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(location.pathname === "/register");

  useEffect(() => {
    setShowRegister(location.pathname === "/register");
  }, [location.pathname]);

  const handleBackToLogin = () => {
    setShowRegister(false);
    navigate("/");
  };

  const handleShowRegister = () => {
    setShowRegister(true);
    navigate("/register");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return (
        <RegisterForm 
          onSuccess={handleBackToLogin} 
          onBackToLogin={handleBackToLogin} 
        />
      );
    }
    
    return (
      <LoginForm 
        onSuccess={() => {
          // Força re-render após login
          console.log('[Index] Login bem-sucedido, aguardando atualização do contexto...');
        }} 
      />
    );
  }

  // Criar um objeto de usuário compatível com o Dashboard
  // Usa o role do AuthContext (vem da tabela profiles) em vez do user_metadata
  const dashboardUser = {
    id: user.id,
    name: user.user_metadata?.name || user.email.split('@')[0],
    email: user.email,
    role: role || 'teacher', // Usa role do contexto, com fallback para teacher
    phone: '',
  };

  console.log('[Index] Role do contexto:', role);

  return <Dashboard user={dashboardUser} />;
};

export default Index;
