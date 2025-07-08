
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

// Pages
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ProfilePage from "@/pages/ProfilePage";
import AlbumPage from "@/pages/AlbumPage";
import SlideshowPage from "@/pages/SlideshowPage";
import NotFound from "@/pages/NotFound";
import UploadPage from "@/pages/UploadPage";
import GuestManagerPage from "@/pages/GuestManagerPage";
import AdminPage from "@/pages/AdminPage";
import GamePage from "@/pages/GamePage";
import GuestSelfieShare from "@/pages/GuestSelfieShare";
import RegisterPage from "@/pages/RegisterPage";
import ProtectedRoute from "@/components/ProtectedRoute";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/album/:albumId" element={<AlbumPage />} />
              <Route path="/slideshow/:albumId" element={<SlideshowPage />} />
              <Route path="/upload/:albumId" element={<UploadPage />} />
              <Route path="/game/:albumId" element={<GamePage />} />
              <Route path="/guest/:albumId/:guestId" element={<GuestSelfieShare />} />
              <Route path="/register/:albumId" element={<RegisterPage />} />
              
              {/* Protected routes that require authentication */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/guests/:albumId" element={
                <ProtectedRoute>
                  <GuestManagerPage />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
