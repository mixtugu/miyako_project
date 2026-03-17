import { useSearchParams } from "react-router-dom";

import GuestCommentPage from "../../components/GuestCommentPage";
import { useAppLang } from "../../hooks/useAppLang";

export default function GuestPageB2() {
  const [params] = useSearchParams();
  const { lang } = useAppLang();
  const photoId = params.get("photo") ?? "k1";

  return <GuestCommentPage photoId={photoId} lang={lang} />;
}
