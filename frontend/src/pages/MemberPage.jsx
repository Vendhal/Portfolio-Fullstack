import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Particles from '../components/Particles.jsx'
import { useSettings } from '../state/SettingsContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const PROJECT_PLACEHOLDER = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'

export default function MemberPage() {
  const { slug } = useParams()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [error, setError] = useState(null)
  const { effectsOn, bgSpeed, bgDensity } = useSettings()

  useEffect(() => {
    setLoading(true)
    fetch(API_BASE + '/team/slug/' + slug)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(data => { setMember(data); document.title = data.name + ' - Team Portfolio' })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!slug) return
    fetch(API_BASE + '/projects?memberSlug=' + slug)
      .then(r => (r.ok ? r.json() : []))
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [slug])

  const featured = useMemo(() => projects.slice(0, 3), [projects])
  const tags = useMemo(() => {
    const set = new Set()
    projects.forEach(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => set.add(t)))
    return Array.from(set).slice(0, 10)
  }, [projects])

  const variants = {
    'jai-ganesh': { theme: 'cool', speed: 1.1, density: 1.05, blackHoles: 0.9 },
    'jayram-reddy': { theme: 'warm', speed: 0.9, density: 0.95, blackHoles: 1.3 },
    'sai-sandeep': { theme: 'neon', speed: 1.3, density: 1.2, blackHoles: 1.0, shooters: true },
  }

  const timeline = useMemo(() => {
    if (!member) return []
    switch (member.slug) {
      case 'jai-ganesh':
        return [
          { role: 'Frontend Lead', org: 'KL University Innovation Lab', period: '2024 - Present', desc: 'Designs and ships React + Vite experiences with a focus on accessibility and polish.' },
          { role: 'Student Developer', org: 'Hackathons & Clubs', period: '2023 - 2024', desc: 'Delivered winning prototypes using TypeScript, Tailwind, and Firebase across campus competitions.' },
        ];
      case 'jayram-reddy':
        return [
          { role: 'Backend Engineer', org: 'KL University Innovation Lab', period: '2024 - Present', desc: 'Designs resilient APIs and observability pipelines for campus initiatives.' },
          { role: 'Systems Volunteer', org: 'Hackathons & Clubs', period: '2023 - 2024', desc: 'Maintained infra for student hackathons and automated CI for teams.' },
        ];
      case 'sai-sandeep':
        return [
          { role: 'Full-Stack Developer', org: 'KL University Innovation Lab', period: '2024 - Present', desc: 'Builds end-to-end experiences from Spring Boot APIs to Vite frontends.' },
          { role: 'Community Lead', org: 'React KL Chapter', period: '2023 - Present', desc: 'Runs weekly code labs focused on accessibility, performance, and DX best practices.' },
        ];
      default:
        return []
    }
  }, [member])

  const handleImageError = (e) => {
    if (e.currentTarget.dataset.fallback === '1') return
    e.currentTarget.dataset.fallback = '1'
    e.currentTarget.src = PROJECT_PLACEHOLDER
  }

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Loading...</div>
  if (error || !member) return <div className="container" style={{ paddingTop: 40 }}>Not found. <Link to="/">Back home</Link></div>

  const cfgBase = variants[member.slug] || { theme: 'default', speed: 1, density: 1, blackHoles: 1, shooters: true }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {effectsOn && (
        <Particles seed={member.slug} {...cfgBase} speed={cfgBase.speed * bgSpeed} density={cfgBase.density * bgDensity} enabled={effectsOn} />
      )}
      <Link to="/" className="back-home-btn">
        <span className="back-home-glow" aria-hidden />
        <span className="back-home-icon" aria-hidden />
        <span className="back-home-text">Back to Home</span>
      </Link>

      {/* Hero */}
      <section className="hero" style={{ '--hero-delay': '0.2s' }}>
        <img className="hero-photo" src={member.photoUrl} alt={member.name} loading="eager" fetchpriority="high" decoding="async" />
        <div className="hero-content">
          <h1 className="hero-name">{member.name}</h1>
          <p className="hero-role">{member.role}</p>
          <p className="hero-bio">{member.bio}</p>
          <div className="hero-actions">
            {member.githubUrl && (
              <a className="social-btn social-github" href={member.githubUrl} target="_blank" rel="noreferrer">
                <span className="social-btn-icon" aria-hidden>?</span>
                <span className="social-btn-label">GitHub</span>
              </a>
            )}
            {member.linkedinUrl && (
              <a className="social-btn social-linkedin" href={member.linkedinUrl} target="_blank" rel="noreferrer">
                <span className="social-btn-icon" aria-hidden>?</span>
                <span className="social-btn-label">LinkedIn</span>
              </a>
            )}
            {member.twitterUrl && (
              <a className="social-btn social-twitter" href={member.twitterUrl} target="_blank" rel="noreferrer">
                <span className="social-btn-icon" aria-hidden>?</span>
                <span className="social-btn-label">Twitter</span>
              </a>
            )}
            <a className="social-btn social-contact" href="/#contact">
              <span className="social-btn-icon" aria-hidden>?</span>
              <span className="social-btn-label">Contact</span>
            </a>
          </div>
        </div>
      </section>

      {/* Skills */}
      {tags.length > 0 && (
        <section className="member-section">
          <h3 className="section-title">Skills & Tools</h3>
          <div className="chips">
            {tags.map((t, i) => <span key={i} className="chip">{t}</span>)}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      <section className="member-section">
        <h3 className="section-title">Featured Projects</h3>
        {featured.length === 0 ? (
          <p className="muted">No featured projects yet.</p>
        ) : (
          <div className="grid">
            {featured.map((p, idx) => (
              <div key={p.id || p.title} className="card card-lg" style={{ '--card-index': idx }}>
                <img
                  src={p.imageUrl || PROJECT_PLACEHOLDER}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                  data-fallback={p.imageUrl ? undefined : '1'}
                />
                <h3>{p.title}</h3>
                <p className="subtle">{p.description}</p>
                {p.tags && <p className="muted" style={{ marginTop: 6 }}>{p.tags}</p>}
                <div className="links" style={{ marginTop: 8 }}>
                  {p.repoUrl && <a href={p.repoUrl} target="_blank">Repo</a>}
                  {p.liveUrl && <a href={p.liveUrl} target="_blank">Live</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Experience Timeline */}
      {timeline.length > 0 && (
        <section className="member-section">
          <h3 className="section-title">Experience</h3>
          <div className="timeline">
            {timeline.map((t, i) => (
              <div key={i} className="timeline-item">
                <div className="bullet" />
                <div className="content">
                  <div className="row1">
                    <strong>{t.role}</strong>
                    <span className="muted"> @ {t.org}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, margin: '2px 0 6px' }}>{t.period}</div>
                  <div className="subtle">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}


