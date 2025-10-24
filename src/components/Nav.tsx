import { Link } from "react-router-dom";

export default function Nav() {
  const link: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    textDecoration: "none",
    border: "1px solid #e5e5e5",
  };
  const wrap: React.CSSProperties = {
    display: "flex",
    gap: 8,
    padding: 12,
    borderBottom: "1px solid #f0f0f0",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 10,
  };
  return (
    <nav style={wrap}>
      <Link to="/guest/a" style={link}>李鍾根さん</Link>
      <Link to="/guest/b" style={link}>兒玉光雄さん</Link>
      <Link to="/host" style={link}>Gallery</Link>
      <a href="https://careful-wrinkle-de0.notion.site/HOME-2956e1cc4225801085a1e4d485e1e07b?pvs=143" style={link}>HOME</a>
    </nav>
  );
}