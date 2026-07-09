import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { routePermissions } from './auth/authData';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Units from './pages/Units';
import Suppliers from './pages/Suppliers';
import SupplierProfile from './pages/SupplierProfile';
import Recipients from './pages/Recipients';
import RecipientProfile from './pages/RecipientProfile';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import CurrentStock from './pages/CurrentStock';
import StockMovements from './pages/StockMovements';
import LowStock from './pages/LowStock';
import IncomingDoc from './pages/IncomingDoc';
import OutgoingDoc from './pages/OutgoingDoc';
import InventoryCount from './pages/InventoryCount';
import Reports from './pages/Reports';
import ActivityLog from './pages/ActivityLog';
import Users from './pages/Users';
import Permissions from './pages/Permissions';
import Settings from './pages/Settings';
import BackupRestore from './pages/BackupRestore';

type ProtectedPageProps = {
  path: string;
  children: ReactNode;
};

function ProtectedPage({ path, children }: ProtectedPageProps) {
  return (
    <ProtectedRoute permission={routePermissions[path]}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedPage path="/"><Dashboard /></ProtectedPage>} />
      <Route path="/items" element={<ProtectedPage path="/items"><Items /></ProtectedPage>} />
      <Route path="/categories" element={<ProtectedPage path="/categories"><Categories /></ProtectedPage>} />
      <Route path="/units" element={<ProtectedPage path="/units"><Units /></ProtectedPage>} />
      <Route path="/suppliers" element={<ProtectedPage path="/suppliers"><Suppliers /></ProtectedPage>} />
      <Route path="/suppliers/:id" element={<ProtectedPage path="/suppliers"><SupplierProfile /></ProtectedPage>} />
      <Route path="/recipients" element={<ProtectedPage path="/recipients"><Recipients /></ProtectedPage>} />
      <Route path="/recipients/:id" element={<ProtectedPage path="/recipients"><RecipientProfile /></ProtectedPage>} />
      <Route path="/warehouses" element={<ProtectedPage path="/warehouses"><Warehouses /></ProtectedPage>} />
      <Route path="/locations" element={<ProtectedPage path="/locations"><Locations /></ProtectedPage>} />
      <Route path="/stock" element={<ProtectedPage path="/stock"><CurrentStock /></ProtectedPage>} />
      <Route path="/movements" element={<ProtectedPage path="/movements"><StockMovements /></ProtectedPage>} />
      <Route path="/low-stock" element={<ProtectedPage path="/low-stock"><LowStock /></ProtectedPage>} />
      <Route path="/movement" element={<Navigate to="/movements" replace />} />
      <Route path="/incoming" element={<ProtectedPage path="/incoming"><IncomingDoc /></ProtectedPage>} />
      <Route path="/outgoing" element={<ProtectedPage path="/outgoing"><OutgoingDoc /></ProtectedPage>} />
      <Route path="/inventory" element={<ProtectedPage path="/inventory"><InventoryCount /></ProtectedPage>} />
      <Route path="/reports" element={<ProtectedPage path="/reports"><Reports /></ProtectedPage>} />
      <Route path="/users" element={<ProtectedPage path="/users"><Users /></ProtectedPage>} />
      <Route path="/permissions" element={<ProtectedPage path="/permissions"><Permissions /></ProtectedPage>} />
      <Route path="/activity" element={<ProtectedPage path="/activity"><ActivityLog /></ProtectedPage>} />
      <Route path="/settings" element={<ProtectedPage path="/settings"><Settings /></ProtectedPage>} />
      <Route path="/backup" element={<ProtectedPage path="/backup"><BackupRestore /></ProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
