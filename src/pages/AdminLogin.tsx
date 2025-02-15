import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      return session;
    },
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      console.log("Current profile:", data);
      return data;
    },
    enabled: !!session?.user?.id,
    retry: false, // Don't retry on failure
  });

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        if (event === "SIGNED_IN") {
          // Check if user is admin after sign in
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession?.user?.id)
            .single();

          console.log("Profile after sign in:", profile);

          if (error) {
            console.error("Error checking admin status:", error);
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao verificar suas permissões.",
              variant: "destructive",
            });
            return;
          }

          if (profile?.is_admin) {
            navigate("/admin");
          } else {
            toast({
              title: "Acesso negado",
              description: "Você não tem permissão para acessar a área administrativa.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Show error if user is not admin
  useEffect(() => {
    if (!isSessionLoading && !isProfileLoading && session && profile !== null && !profile?.is_admin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar a área administrativa.",
        variant: "destructive",
      });
      supabase.auth.signOut();
    }
  }, [session, profile, isSessionLoading, isProfileLoading, toast]);

  // Show loading state
  if (isSessionLoading || (session && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already logged in and is admin, redirect to admin
  if (session && profile?.is_admin) {
    navigate("/admin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-8">Área Administrativa</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#8B1F41',
                    brandAccent: '#4A0404',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'Seu email',
                  password_input_placeholder: 'Sua senha',
                },
              },
            }}
            providers={[]}
            view="sign_in"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;