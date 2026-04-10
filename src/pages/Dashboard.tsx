import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProjectCard from '../components/ProjectCard';
import { ProjectStatus } from '../types';

const STATUS_ORDER: ProjectStatus[] = ['draft','submitted','under_review','pending_approval','approved','rejected'];

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px', padding: '16px 20px',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 590, color, letterSpacing: '-0.05em' }}>{count}</div>
      <div style={{ fontSize: '12px', color: '#8a8f98', fontWeight: 510, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { projects, currentRole, currentUserId } = useStore();
  const navigate = useNavigate();

  const counts: Record<ProjectStatus, number> = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  const recent = [...projects]
    .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
    .slice(0, 5);

  const myProjects = projects.filter(p => p.createdByUserId === currentUserId).slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#8a8f98', margin: '4px 0 0' }}>
          Digital Manufacturing PMO — Resource Planning
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <StatCard label="Draft" count={counts.draft} color="#62666d" />
        <StatCard label="Submitted" count={counts.submitted} color="#5e6ad2" />
        <StatCard label="Under Review" count={counts.under_review} color="#f59e0b" />
        <StatCard label="Pending Approval" count={counts.pending_approval} color="#a855f7" />
        <StatCard label="Approved" count={counts.approved} color="#27a644" />
        <StatCard label="Rejected" count={counts.rejected} color="#ef4444" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(currentRole === 'project_lead' || currentRole === 'resource_manager') && (
          <button onClick={() => navigate('/projects/new')} style={primaryBtn}>
            + New Project
          </button>
        )}
        {(currentRole === 'resource_manager' || currentRole === 'pmo_admin') && (
          <button onClick={() => navigate('/review')} style={ghostBtn}>
            Review Queue ({counts.submitted + counts.under_review})
          </button>
        )}
        {currentRole === 'prioritisation_board' && (
          <button onClick={() => navigate('/approval')} style={primaryBtn}>
            Approval Queue ({counts.pending_approval})
          </button>
        )}
        {currentRole === 'pmo_admin' && (
          <button onClick={() => navigate('/admin')} style={ghostBtn}>
            Admin Configuration
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* My projects */}
        {myProjects.length > 0 && (
          <div>
            <h2 style={sectionHead}>My Projects</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myProjects.map(p => (
                <ProjectCard key={p.id} project={p} onClick={() => navigate(`/my-projects`)} />
              ))}
            </div>
          </div>
        )}
        {/* Recent activity */}
        <div>
          <h2 style={sectionHead}>Recent Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {recent.length === 0 && (
              <p style={{ color: '#62666d', fontSize: '14px' }}>No projects yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: '#5e6ad2', color: '#fff', border: 'none',
  borderRadius: '6px', padding: '8px 16px', fontSize: '13px',
  fontWeight: 510, cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', color: '#d0d6e0',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px', padding: '8px 16px', fontSize: '13px',
  fontWeight: 510, cursor: 'pointer',
};

const sectionHead: React.CSSProperties = {
  fontSize: '13px', fontWeight: 590, color: '#8a8f98',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  margin: '0 0 12px',
};
