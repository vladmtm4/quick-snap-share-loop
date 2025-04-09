
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage, SupportedLanguage } from "@/lib/i18n";
import { Globe, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, translate, isLoading } = useLanguage();
  const [showDemo, setShowDemo] = useState(false);
  const [demoText, setDemoText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: "en", label: translate("english") },
    { code: "he", label: translate("hebrew") },
  ];

  const { translateAsync } = useLanguage();

  const handleTranslateDemo = async () => {
    if (!demoText.trim()) return;
    
    const result = await translateAsync(demoText);
    setTranslatedText(result);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Globe className="h-5 w-5" />
            {isLoading && (
              <span className="absolute -top-1 -right-1">
                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
              </span>
            )}
            <span className="sr-only">{translate("language")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={language === lang.code ? "font-bold" : ""}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setShowDemo(!showDemo)}>
            {showDemo ? "Hide Translation Demo" : "Try Translation Demo"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showDemo && (
        <div className="absolute right-0 top-16 bg-white p-4 rounded-md shadow-lg z-50 border w-80">
          <h3 className="font-semibold mb-2">Translation Demo</h3>
          <input
            type="text"
            value={demoText}
            onChange={(e) => setDemoText(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Enter text to translate"
          />
          <Button
            onClick={handleTranslateDemo}
            disabled={isLoading || !demoText.trim()}
            size="sm"
            className="w-full mb-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Translate
          </Button>
          {translatedText && (
            <div className="border-t pt-2">
              <p className="text-sm font-medium">Translated:</p>
              <p className="text-sm break-words">{translatedText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
