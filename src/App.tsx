import { Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import GuestPageA from "./pages/guest/GuestPageA";
import GuestPageB from "./pages/guest/GuestPageB";
import HostPage from "./pages/host/HostPage";
import GuestPageA2 from "./pages/guest/GuestPageA2";
import GuestPageB2 from "./pages/guest/GuestPageB2";
import HostPicture from "./pages/host/HostPicture";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        {/* 모바일용 게스트 2페이지 */}
        <Route path="/guest/a" element={<GuestPageA />} />
        <Route path="/guest/a2" element={<GuestPageA2 />} />
        <Route path="/guest/b" element={<GuestPageB />} />
        <Route path="/guest/b2" element={<GuestPageB2 />} />

        {/* 데스크탑용 호스트 페이지 */}
        <Route path="/host" element={<HostPage />} />
        <Route path="/host/picture" element={<HostPicture />} />

        {/* 기본 진입시 게스트 A로 이동 */}
        <Route path="*" element={<Navigate to="/guest/a" replace />} />
        
      </Routes>
    </>
  );
}