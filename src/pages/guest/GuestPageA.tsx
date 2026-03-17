import GuestGalleryPage from "../../components/GuestGalleryPage";
import { useAppLang } from "../../hooks/useAppLang";
import { guestGalleryById } from "../../lib/gallery";

export default function GuestPageA() {
  const { lang } = useAppLang();

  return <GuestGalleryPage gallery={guestGalleryById.a} lang={lang} />;
}
