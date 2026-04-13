import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProjectCard from '../components/ProjectCard';

export default function Approval() {
  const { projects } = useStore();
  const navigate = useNavigate();

  const queue = projects.filter(p => p.status === 'pending_approval');
  const approved = projects.filter(p => p.status === 'approved');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={h1}>Approval Queue</h1>
        <p style={sub}>{queue.length} project{queue.length !== 1 ? 's' : ''} awaiting decision</p>
      </div>

      {queue.length === 0 && (
        <div style={{ color: 'var(--c-text-4)', fontSize: '14px', padding: '16px 0 32px' }}>
          No projects pending approval.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        {queue.map(p => (
          <ProjectCard key={p.id} project={p} onClick={() => navigate(`/approval/${p.id}`)} />
        ))}
      </div>

      {approved.length > 0 && (
        <>
          <h2 style={sectionHead}>Approved Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {approved.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.03em', margin: 0 };
const sub: React.CSSProperties = { fontSize: '13px', color: 'var(--c-text-3)', margin: '2px 0 0' };
const sectionHead: React.CSSProperties = { fontSize: '13px', fontWeight: 590, color: 'var(--c-text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' };
