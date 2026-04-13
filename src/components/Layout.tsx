import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <Header />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
