
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, X, LogOut, User, Shield } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false }) => {
  const { translate } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div className="flex items-center">
        {showBackButton ? (
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        ) : (
          <Link to="/" className="text-xl font-bold text-brand-blue">
            {translate("appName")}
          </Link>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <LanguageSelector />
        
        {user ? (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">
              <User className="h-4 w-4 mr-1" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
