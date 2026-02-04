import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ScheduleView } from "./ScheduleView";
import { TeachersView } from "./TeachersView";
import { ProfileView } from "./ProfileView";
import { SpecialListsView } from "./SpecialListsView";
import { TeacherAdvancedSearch } from "@/components/Teachers/TeacherAdvancedSearch";
import { LessonTypesManagement } from "@/components/Teachers/LessonTypesManagement";
import { TeacherActivityView } from "./TeacherActivityView";
import { PrivacySettings } from "@/components/Settings/PrivacySettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/Auth/AuthContext";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher';
    phone?: string;
    level?: string;
    hasCertification?: boolean;
  };
}

// Estado para visualização de agenda de professor específico
interface SelectedTeacher {
  id: string;
  name: string;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedTeacher, setSelectedTeacher] = useState<SelectedTeacher | null>(null);
  const isMobile = useIsMobile();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    console.log('Dashboard: handleLogout chamado');
    try {
      await signOut();
      console.log('Dashboard: signOut concluído');
    } catch (error) {
      console.error('Dashboard: Erro ao fazer logout:', error);
    }
  };

  // Handler para visualizar agenda de um professor específico (admin)
  const handleViewTeacherSchedule = (teacherId: string, teacherName: string) => {
    setSelectedTeacher({ id: teacherId, name: teacherName });
    setActiveTab('schedule');
  };

  // Handler para voltar da visualização de agenda específica
  const handleBackFromSchedule = () => {
    setSelectedTeacher(null);
  };

  // Quando muda de tab, limpa a seleção de professor
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Não limpa a seleção se estiver indo para a agenda (pode vir da busca)
    if (tab !== 'schedule') {
      setSelectedTeacher(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        // Admin não tem agenda própria, apenas visualiza as dos professores
        if (user.role === 'admin') {
          return (
            <ScheduleView 
              user={user} 
              selectedTeacherId={selectedTeacher?.id}
              selectedTeacherName={selectedTeacher?.name}
              onBack={selectedTeacher ? handleBackFromSchedule : undefined}
            />
          );
        }
        // Professor vê sua própria agenda
        return <ScheduleView user={user} />;
      case 'teachers':
        return user.role === 'admin' ? (
          <TeachersView onViewSchedule={handleViewTeacherSchedule} />
        ) : null;
      case 'search':
        return (
          <TeacherAdvancedSearch 
            onViewSchedule={user.role === 'admin' ? handleViewTeacherSchedule : undefined}
          />
        );
      case 'lesson-types':
        return user.role === 'admin' ? <LessonTypesManagement /> : null;
      case 'profile':
        return <ProfileView user={user} />;
      case 'privacy':
        return <PrivacySettings />;
      case 'special-lists':
        return user.role === 'admin' ? <SpecialListsView /> : null;
      case 'teacher-activity':
        return user.role === 'admin' ? (
          <TeacherActivityView onViewSchedule={handleViewTeacherSchedule} />
        ) : null;
      default:
        return user.role === 'admin' 
          ? <ScheduleView user={user} selectedTeacherId={selectedTeacher?.id} selectedTeacherName={selectedTeacher?.name} />
          : <ScheduleView user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="flex relative">
        <Sidebar 
          userRole={user.role}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <main className={`flex-1 p-6 ${isMobile ? 'w-full' : 'ml-0'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};