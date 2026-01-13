import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  Users,
  Search,
  Star,
  Shield,
  User,
  Clock,
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

interface SidebarProps {
  userRole: 'admin' | 'teacher';
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const Sidebar = ({ userRole, activeTab, onTabChange, className }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);
  const menuItems = [
    {
      id: 'schedule',
      label: 'Minha Agenda',
      icon: Calendar,
      roles: ['admin', 'teacher']
    },
    {
      id: 'teachers',
      label: 'Professores',
      icon: Users,
      roles: ['admin']
    },
    {
      id: 'search',
      label: 'Buscar Horários',
      icon: Search,
      roles: ['admin', 'teacher']
    },
    {
      id: 'lesson-types',
      label: 'Tipos de Aula',
      icon: BookOpen,
      roles: ['admin']
    },
    {
      id: 'profile',
      label: 'Meu Perfil',
      icon: User,
      roles: ['admin', 'teacher']
    },
    {
      id: 'special-lists',
      label: 'Listas Especiais',
      icon: Star,
      roles: ['admin']
    }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 bottom-4 z-50 rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}
      <aside 
        className={cn(
          "bg-card border-r transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile ? "fixed z-40 h-full shadow-lg" : "w-64 h-[calc(100vh-73px)]",
          className
        )}
      >
        <div className="p-6">
          <nav className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-smooth",
                    activeTab === item.id && "bg-primary text-primary-foreground shadow-custom"
                  )}
                  onClick={() => {
                    onTabChange(item.id);
                    if (isMobile) setIsOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};