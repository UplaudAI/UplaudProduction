
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import VerifyOtp from './pages/VerifyOtp'; // adjust path if needed
import Dashboard from './pages/Dashboard';
import Leaderboard from "@/pages/ReviewerList";
import ProfilePage from "@/pages/ProfilePage";
import ReviewerList from './pages/ReviewerList';
import BusinessPage from "./pages/BusinessPage";
import ExpertPage from './pages/ExpertProfile'; // Adjust path as needed


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/" element={<ReviewerList />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/expert/:id" element={<ExpertPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/:handle" element={<Dashboard />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/leaderboard" element={<Leaderboard />} /> 
            <Route path="/business/:slug" element={<BusinessPage />} />

            
<Route path="/profile/:id" element={<ProfilePage />} />
          
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
