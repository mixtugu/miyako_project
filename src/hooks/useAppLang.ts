import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { buildSearchWithLang, persistAppLang, resolveAppLang, type AppLang } from "../lib/lang";

type UseAppLangOptions = {
  syncUrl?: boolean;
};

export function useAppLang(options: UseAppLangOptions = {}) {
  const { syncUrl = false } = options;
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLang] = useState<AppLang>(() => resolveAppLang(location.search));

  useEffect(() => {
    setLang(resolveAppLang(location.search));
  }, [location.search]);

  useEffect(() => {
    persistAppLang(lang);
  }, [lang]);

  useEffect(() => {
    if (!syncUrl) {
      return;
    }

    const nextSearch = buildSearchWithLang(lang, location.search);
    if (nextSearch === location.search) {
      return;
    }

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch,
      },
      { replace: true },
    );
  }, [lang, location.pathname, location.search, navigate, syncUrl]);

  return {
    lang,
    setLang,
  };
}
