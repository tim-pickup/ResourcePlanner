import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProjectCard from '../components/ProjectCard';

export default function Review() {
  const { projects, updateProject } = useStore();
  const navigate = useNavigate();

  const queue = projects.filter(p => p.status === 'submitted' || p.status === 'under_review');

  function handleClick(id: string, status: string) {
    if (status === 'submitted') updateProject(id, { status: 'under_review' });
    navigate(`/review/${id}`);
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={h1}>Review Queue</h1>
        <p style={sub}>{queue.length} project{queue.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {queue.length === 0 && (
        <div style={{ color: 'var(--c-text-4)', fontSize: '14px', padding: '32px 0' }}>
          No projects in the review queue.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {queue.map(p => (
          <ProjectCard key={p.id} project={p} onClick={() => handleClick(p.id, p.status)} />
        ))}
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: 'var(--c-text-1)', letterSpacing: '-0.03em', margin: 0 };
const sub: React.CSSProperties = { fontSize: '13px', color: 'var(--c-text-3)', margin: '2px 0 0' };
