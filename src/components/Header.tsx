
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from "@/lib/i18n";
import { ArrowLeft, LogIn, LogOut } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
  hideAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false, hideAuthButtons = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { translate } = useLanguage();
  
  const goBack = () => {
    navigate(-1);
  };
  
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="text-xl font-semibold text-brand-blue dark:text-blue-400">
            PhotoShare
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <ThemeToggle />
          
          {!hideAuthButtons && (
            user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-1 dark:border-gray-700 dark:text-gray-200"
              >
                <LogOut className="h-4 w-4" />
                <span>{translate("signOut")}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1 dark:border-gray-700 dark:text-gray-200"
              >
                <LogIn className="h-4 w-4" />
                <span>{translate("signIn")}</span>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
