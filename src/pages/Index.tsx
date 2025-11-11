import { useState } from "react";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { LoginForm } from "@/components/Auth/LoginForm";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { useAuth } from "@/components/Auth/AuthContext";

const Index = () => {
  const { user, role, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

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
          onSuccess={() => setShowRegister(false)} 
          onBackToLogin={() => setShowRegister(false)} 
        />
      );
    }
    
    return (
      <LoginForm 
        onSuccess={() => {}} 
      />
    );
  }

  // Criar um objeto de usuário compatível com o Dashboard
  const dashboardUser = {
    id: user.id,
    name: user.email.split('@')[0], // Temporário até termos o nome real
    email: user.email,
    role: role || 'teacher',
    phone: '',
    level: 'Iniciante',
    hasCertification: false
  };

  return <Dashboard user={dashboardUser} />;
};

export default Index;
