
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth-context";

interface UserMenuProps {
  session: any;
}

export const UserMenu = ({ session }: UserMenuProps) => {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();

  // Determina se o usuário está realmente autenticado verificando se há um usuário ativo na sessão fornecida
  // Ou se há um perfil de usuário no contexto de autenticação
  const isAuthenticated = !!session?.user?.id || !!profile?.id;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/");
    } catch (error: any) {
      toast.error("Erro ao sair: " + error.message);
    }
  };

  const handleAreaClick = () => {
    if (isAuthenticated) {
      // Se já está logado, vá para a área apropriada
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/profile");
      }
    } else {
      // Se não está logado, vá para o login
      navigate("/login");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="hidden md:flex gap-2">
        <Button variant="outline" onClick={handleAreaClick}>
          Área do Dentista
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={session?.user?.user_metadata?.avatar_url || (profile?.avatar_url || "")} 
              alt="Avatar do usuário"
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/profile")}>
          {isAdmin ? "Painel Admin" : "Meu Perfil"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/orders")}>
          Meus Pedidos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
