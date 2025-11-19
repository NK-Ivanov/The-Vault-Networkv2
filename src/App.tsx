import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import Community from "./pages/Community";
import Partners from "./pages/Partners";
import ForBusinesses from "./pages/ForBusinesses";
import Login from "./pages/Login";
import PartnerDashboard from "./pages/PartnerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerPro from "./pages/PartnerPro";
import AutomationDetail from "./pages/AutomationDetail";
import Learners from "./pages/Learners";
import LearnerDashboard from "./pages/LearnerDashboard";
import LearnerModule from "./pages/LearnerModule";
import LearnerProgression from "./pages/LearnerProgression";
import Quiz from "./pages/Quiz";
import OutreachPlanner from "./pages/OutreachPlanner";
import VaultLibrary from "./pages/VaultLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/community" element={<Community />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/for-businesses" element={<ForBusinesses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/partner-dashboard" element={<PartnerDashboard />} />
            <Route path="/partner-pro" element={<PartnerPro />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/automation/:id" element={<AutomationDetail />} />
            <Route path="/learners" element={<Learners />} />
            <Route path="/learner-dashboard" element={<LearnerDashboard />} />
            <Route path="/learner-module/:moduleId" element={<LearnerModule />} />
            <Route path="/learner-progression" element={<LearnerProgression />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/outreach-planner" element={<OutreachPlanner />} />
            <Route path="/vault-library" element={<VaultLibrary />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
