import { useState, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider, HelmetServerState } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "./AppRoutes";

export type AppProps = {
  RouterComponent?: ComponentType<any>;
  routerProps?: Record<string, unknown>;
  helmetContext?: HelmetServerState;
};

const App = ({
  RouterComponent = BrowserRouter,
  routerProps = {},
  helmetContext,
}: AppProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <HelmetProvider context={helmetContext}>
            <Toaster />
            <Sonner />
            <RouterComponent {...routerProps}>
              <AppRoutes />
            </RouterComponent>
          </HelmetProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
