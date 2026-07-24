import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import CancelPage from './pages/CancelPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<BookingPage />} />
        <Route path="/cancel/:token" element={<CancelPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
