import GuestGalleryPage from "../../components/GuestGalleryPage";
import { useAppLang } from "../../hooks/useAppLang";
import { guestGalleryById } from "../../lib/gallery";

export default function GuestPageB() {
  const { lang } = useAppLang();

  return <GuestGalleryPage gallery={guestGalleryById.b} lang={lang} />;
}
