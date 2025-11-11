import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  user?: {
    name: string;
    role: 'admin' | 'teacher';
  };
  onLogout?: () => void;
}

export const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="border-b bg-card shadow-custom-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">AgendaPro</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Sistema de Gestão</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role === 'admin' ? 'Administrador' : 'Professor'}
                  </p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configurações</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    <span className="ml-2 hidden lg:inline">Sair</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fazer logout</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </header>
  );
};