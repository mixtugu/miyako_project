import { useSearchParams } from "react-router-dom";

import GuestCommentPage from "../../components/GuestCommentPage";
import { useAppLang } from "../../hooks/useAppLang";

export default function GuestPageA2() {
  const [params] = useSearchParams();
  const { lang } = useAppLang();
  const photoId = params.get("photo") ?? "l1";

  return <GuestCommentPage photoId={photoId} lang={lang} />;
}
