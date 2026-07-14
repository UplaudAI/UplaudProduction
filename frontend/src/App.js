import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BusinessPage from "@/pages/BusinessPage";
import CaseStudyPage from "@/pages/CaseStudyPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/business/the-solved-skin" replace />} />
          <Route path="/business/:slug" element={<BusinessPage />} />
          <Route path="/business/:slug/blog/:csSlug" element={<CaseStudyPage />} />
          <Route path="*" element={<Navigate to="/business/the-solved-skin" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
