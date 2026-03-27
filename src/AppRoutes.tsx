import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "@/components/Loader"; // need loader? check if exists. if not fallback simple.

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Login = lazy(() => import("./pages/Login"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ReviewerList = lazy(() => import("./pages/ReviewerList"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BusinessPage = lazy(() => import("./pages/BusinessPage"));
const ExpertPage = lazy(() => import("./pages/ExpertProfile"));
const ShareReview = lazy(() => import("./pages/ShareReview"));

const Fallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">
    Loading...
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<Fallback />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/leaderboard" element={<ReviewerList />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="/expert/:id" element={<ExpertPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/:handle" element={<Dashboard />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/business/:slug" element={<BusinessPage />} />
      <Route path="/share" element={<ShareReview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
