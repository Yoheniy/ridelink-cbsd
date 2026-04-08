import { Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { useDarkMode } from "./hooks/useDarkMode";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const { isDark, toggle } = useDarkMode();
  const { pathname } = useLocation();

  const showNavbar = pathname !== "/dashboard";

  return (
    <div className="min-h-screen">
      {showNavbar && <Navbar isDark={isDark} onToggleDark={toggle} />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
