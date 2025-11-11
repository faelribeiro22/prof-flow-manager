import { RegisterForm } from "@/components/Auth/RegisterForm";
import { useAuth } from "@/components/Auth/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RegisterForm 
      onSuccess={() => navigate("/")} 
      onBackToLogin={() => navigate("/")} 
    />
  );
};

export default Register;