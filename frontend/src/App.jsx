import { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login, Signup } from './pages/Auth.jsx';
import AdminDashboard from './pages/Admin.jsx';
import StoreList from './pages/Stores.jsx';
import OwnerDashboard from './pages/Owner.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const home = { admin: '/admin', user: '/stores', store_owner: '/owner' };

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={home[user.role]} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const nav = useNavigate();
  const login = (token, u) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); nav(home[u.role]); };
  const logout = () => { localStorage.clear(); setUser(null); nav('/login'); };
  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {user && <nav><b>Store Ratings</b><span>{user.name} ({user.role}) <button className="secondary" onClick={logout}>Logout</button></span></nav>}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/stores" element={<Guard roles={['user']}><StoreList /></Guard>} />
        <Route path="/owner" element={<Guard roles={['store_owner']}><OwnerDashboard /></Guard>} />
        <Route path="*" element={<Navigate to={user ? home[user.role] : '/login'} replace />} />
      </Routes>
    </AuthCtx.Provider>
  );
}
