import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProjectCard from '../components/ProjectCard';
import { genId } from '../utils/dates';

export default function MyProjects() {
  const { projects, demandRows, currentUserId, addProject, setProjectDemandRows } = useStore();
  const navigate = useNavigate();

  const myProjects = projects
    .filter(p => p.createdByUserId === currentUserId)
    .sort((a, b) => (b.submittedAt ?? b.startDate).localeCompare(a.submittedAt ?? a.startDate));

  function handleRevise(projectId: string) {
    const original = projects.find(p => p.id === projectId);
    if (!original) return;
    const newId = genId();
    addProject({
      ...original,
      id: newId,
      status: 'draft',
      rejectionReason: '',
      submittedAt: null,
      name: `${original.name} (Revised)`,
    });
    const originalRows = demandRows.filter(r => r.projectId === projectId);
    setProjectDemandRows(newId, originalRows.map(r => ({ ...r, id: genId(), projectId: newId })));
    navigate(`/projects/new?id=${newId}`);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={h1}>My Projects</h1>
          <p style={sub}>{myProjects.length} project{myProjects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/projects/new')} style={primaryBtn}>
          + New Project
        </button>
      </div>

      {myProjects.length === 0 && (
        <div style={empty}>
          No projects yet. <button onClick={() => navigate('/projects/new')} style={linkBtn}>Create one →</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {myProjects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onClick={p.status === 'draft' ? () => navigate(`/projects/new?id=${p.id}`) : undefined}
            extra={
              <div style={{ display: 'flex', gap: '8px' }}>
                {p.status === 'draft' && (
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/new?id=${p.id}`); }} style={editBtn}>
                    Edit
                  </button>
                )}
                {p.status === 'rejected' && (
                  <button onClick={(e) => { e.stopPropagation(); handleRevise(p.id); }} style={reviseBtn}>
                    Revise & Resubmit
                  </button>
                )}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 590, color: '#f7f8f8', letterSpacing: '-0.03em', margin: 0 };
const sub: React.CSSProperties = { fontSize: '13px', color: '#8a8f98', margin: '2px 0 0' };
const primaryBtn: React.CSSProperties = { background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 510, cursor: 'pointer' };
const editBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', color: '#d0d6e0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 510, cursor: 'pointer' };
const reviseBtn: React.CSSProperties = { background: 'rgba(94,106,210,0.15)', color: '#7170ff', border: '1px solid rgba(94,106,210,0.3)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 510, cursor: 'pointer' };
const empty: React.CSSProperties = { color: '#62666d', fontSize: '14px', padding: '32px 0' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#7170ff', cursor: 'pointer', fontSize: '14px', padding: 0 };
