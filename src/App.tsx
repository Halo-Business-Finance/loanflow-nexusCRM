import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { AuthPage } from "@/components/auth/AuthPage";
import { SecurityManager } from "@/components/security/SecurityManager";
import { GeoSecurityCheck } from "@/components/GeoSecurityCheck";
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary";
import { CSPHeaders } from "@/components/security/CSPHeaders";
import { SecurityEnhancementProvider } from "@/components/security/SecurityEnhancementProvider";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import LeadDocuments from "./pages/LeadDocuments";
import Pipeline from "./pages/Pipeline";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Documents from "./pages/Documents";
import Activities from "./pages/Activities";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import UsersLeads from "./pages/UsersLeads";
import Resources from "./pages/Resources";
import Enterprise from "./pages/Enterprise";
import Integrations from "./pages/Integrations";
import AITools from "./pages/AITools";
import APIDocs from "./pages/APIDocs";
import Screenshots from "./pages/Screenshots";
import EmergencyMaintenance from "./pages/EmergencyMaintenance";
import NotFound from "./pages/NotFound";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEnhancedSecurity } from "@/hooks/useEnhancedSecurity";

const queryClient = new QueryClient();

function KeyboardShortcutsProvider() {
  useKeyboardShortcuts();
  return null;
}

function SecurityProvider() {
  useEnhancedSecurity();
  return null;
}

function AuthenticatedApp() {
  const { user, loading, userRole } = useAuth();
  
  // Only log sensitive data in development mode
  if (import.meta.env.DEV) {
    console.log('AuthenticatedApp state:', { 
      user: !!user, 
      loading, 
      userRole, 
      userId: user?.id?.substring(0, 8) + '...' // Only log partial ID
    });
  }

  if (loading) {
    if (import.meta.env.DEV) {
      console.log('AuthenticatedApp: showing loading spinner');
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3">Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    if (import.meta.env.DEV) {
      console.log('AuthenticatedApp: no user found, redirecting to auth page');
    }
    return <AuthPage />;
  }

  if (import.meta.env.DEV) {
    console.log('AuthenticatedApp: user authenticated, rendering routes');
  }

  return (
    <BrowserRouter>
      <KeyboardShortcutsProvider />
      <SecurityProvider />
      <Routes>
        {/* Public route for authentication */}
        <Route path="/auth" element={<AuthPage />} errorElement={<RouteErrorBoundary />} />
        
        {/* Protected routes - require authentication */}
        {user ? (
          <>
            <Route path="/" element={<Index />} errorElement={<RouteErrorBoundary />} />
            <Route path="/leads" element={<Leads />} errorElement={<RouteErrorBoundary />} />
            <Route path="/leads/:id" element={<LeadDetail />} errorElement={<RouteErrorBoundary />} />
            <Route path="/leads/:leadId/documents" element={<LeadDocuments />} errorElement={<RouteErrorBoundary />} />
            <Route path="/clients" element={<Clients />} errorElement={<RouteErrorBoundary />} />
            <Route path="/clients/:id" element={<ClientDetail />} errorElement={<RouteErrorBoundary />} />
            <Route path="/pipeline" element={<Pipeline />} errorElement={<RouteErrorBoundary />} />
            <Route path="/documents" element={<Documents />} errorElement={<RouteErrorBoundary />} />
            <Route path="/activities" element={<Activities />} errorElement={<RouteErrorBoundary />} />
            <Route path="/reports" element={<Reports />} errorElement={<RouteErrorBoundary />} />
            <Route path="/settings" element={<Settings />} errorElement={<RouteErrorBoundary />} />
            <Route path="/users" element={<Users />} errorElement={<RouteErrorBoundary />} />
            <Route path="/users-leads" element={<UsersLeads />} errorElement={<RouteErrorBoundary />} />
            <Route path="/security" element={<SecurityManager />} errorElement={<RouteErrorBoundary />} />
            <Route path="/enterprise" element={<Enterprise />} errorElement={<RouteErrorBoundary />} />
            <Route path="/integrations" element={<Integrations />} errorElement={<RouteErrorBoundary />} />
            <Route path="/ai-tools" element={<AITools />} errorElement={<RouteErrorBoundary />} />
            <Route path="/screenshots" element={<Screenshots />} errorElement={<RouteErrorBoundary />} />
            <Route path="/api-docs" element={<APIDocs />} errorElement={<RouteErrorBoundary />} />
            <Route path="/resources" element={<Resources />} errorElement={<RouteErrorBoundary />} />
            <Route path="/emergency-maintenance" element={<EmergencyMaintenance />} errorElement={<RouteErrorBoundary />} />
            <Route path="*" element={<NotFound />} errorElement={<RouteErrorBoundary />} />
          </>
        ) : (
          <>
            {/* Redirect all other routes to auth when not logged in */}
            <Route path="*" element={<AuthPage />} errorElement={<RouteErrorBoundary />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

const App = () => {
  console.log('App component rendering...');
  
  return (
    <AsyncErrorBoundary onError={(error) => console.error('AsyncErrorBoundary caught:', error)}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CSPHeaders />
          {/* Temporarily removed GeoSecurityCheck to bypass blocking */}
          <AuthProvider>
            <SecurityEnhancementProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AuthenticatedApp />
              </TooltipProvider>
            </SecurityEnhancementProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AsyncErrorBoundary>
  );
};

export default App;
