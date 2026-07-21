import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import BlogListPage from "@/pages/BlogListPage";
import BlogPostPage from "@/pages/BlogPostPage";
import AdminBlogPage from "@/pages/AdminBlogPage";
import BusinessLoginPage from "@/pages/business/BusinessLoginPage";
import DashboardLayout from "@/components/business/DashboardLayout";
import ImportReviewsPage from "@/pages/business/ImportReviewsPage";
import ReviewsPage from "@/pages/business/ReviewsPage";
import SocialAgentPage from "@/pages/business/SocialAgentPage";
import ReferralAgentPage from "@/pages/business/ReferralAgentPage";
import RedditAgentPage from "@/pages/business/RedditAgentPage";
import InsightsPage from "@/pages/business/InsightsPage";
import SettingsPage from "@/pages/business/SettingsPage";
import InteractionsPage from "@/pages/business/InteractionsPage";
import ConversationsPage from "@/pages/business/ConversationsPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />

          {/* Business (Product MVP Dashboard) */}
          <Route path="/business" element={<BusinessLoginPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/business/import" element={<ImportReviewsPage />} />
            <Route path="/business/interactions" element={<InteractionsPage />} />
            <Route path="/business/conversations" element={<ConversationsPage />} />
            <Route path="/business/reviews" element={<ReviewsPage />} />
            <Route path="/business/social" element={<SocialAgentPage />} />
            <Route path="/business/referrals" element={<ReferralAgentPage />} />
            <Route path="/business/reddit" element={<RedditAgentPage />} />
            <Route path="/business/insights" element={<InsightsPage />} />
            <Route path="/business/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}

export default App;
