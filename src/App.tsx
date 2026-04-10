import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import MyProjects from './pages/MyProjects';
import Review from './pages/Review';
import ReviewDetail from './pages/ReviewDetail';
import Approval from './pages/Approval';
import ApprovalDetail from './pages/ApprovalDetail';
import Admin from './pages/Admin';

function AppInit() {
  const { projects, seedData } = useStore();
  useEffect(() => {
    if (projects.length === 0) seedData();
  }, []);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <AppInit />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects/new" element={<NewProject />} />
          <Route path="my-projects" element={<MyProjects />} />
          <Route path="review" element={<Review />} />
          <Route path="review/:id" element={<ReviewDetail />} />
          <Route path="approval" element={<Approval />} />
          <Route path="approval/:id" element={<ApprovalDetail />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
