import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Scanner from "./pages/Scanner.jsx";
import CreateBatch from "./pages/CreateBatch.jsx";
import Matching from "./pages/Matching.jsx";
import Passport from "./pages/Passport.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/batches/new" element={<CreateBatch />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/passport" element={<Passport />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <footer className="border-t border-moss-100 py-6 text-center text-sm text-ink/50">
        ReLoop AI - An Circular Waste Intelligence Platform 
      </footer>
    </div>
  );
}
