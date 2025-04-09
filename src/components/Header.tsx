
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, X } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n";

interface HeaderProps {
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false }) => {
  const { translate } = useLanguage();

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
      <LanguageSelector />
    </header>
  );
};

export default Header;
