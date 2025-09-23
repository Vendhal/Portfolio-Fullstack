import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from './state/SettingsContext.jsx'

const Particles = lazy(() => import('./components/Particles.jsx'))
const LatestUpdates = lazy(() => import('./components/LatestUpdates.jsx'))

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const PROJECT_PLACEHOLDER = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'

function Header() {
  return (
    <header className="header">
      <h1>Our Team Portfolio</h1>
      <nav>
        <a href="#team">Team</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}

function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(API_BASE + '/team')
      .then(r => r.json())
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="team" className="section">
      <h2>Team</h2>
      {loading ? <p>Loading...</p> : (
        <div className="grid">
          {members.map(m => (
            <div key={m.id} className="card">
              <img className="card-photo team-photo" src={m.photoUrl} alt={m.name} loading="lazy" decoding="async" />
              <h3>{m.name}</h3>
              <p className="muted">{m.role}</p>
              <p>{m.bio}</p>
              <div className="links">
                {m.githubUrl && <a href={m.githubUrl} target="_blank">GitHub</a>}
                {m.linkedinUrl && <a href={m.linkedinUrl} target="_blank">LinkedIn</a>}
                {m.twitterUrl && <a href={m.twitterUrl} target="_blank">Twitter</a>}
                {m.slug && <Link to={'/member/' + m.slug}>Profile</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const handleImageError = (e) => {
    if (e.currentTarget.dataset.fallback === '1') return
    e.currentTarget.dataset.fallback = '1'
    e.currentTarget.src = PROJECT_PLACEHOLDER
  }

  useEffect(() => {
    fetch(API_BASE + '/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="projects" className="section">
      <h2>Projects</h2>
      {loading ? <p>Loading...</p> : (
        <div className="grid">
          {projects.map(p => (
            <div key={p.id || p.title} className="card">
              <img
                className="card-photo project-photo"
                src={p.imageUrl || PROJECT_PLACEHOLDER}
                alt={p.title}
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                data-fallback={p.imageUrl ? undefined : '1'}
              />
              <h3>{p.title}</h3>
              {p.owner?.name && <p className="muted" style={{ margin: '4px 0 8px' }}>By {p.owner.name}</p>}
              <p>{p.description}</p>
              {p.tags && (
                <div className="chips" style={{ marginTop: 6 }}>
                  {p.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                    <span key={i} className="chip">{t}</span>
                  ))}
                </div>
              )}
              <div className="links">
                {p.repoUrl && <a href={p.repoUrl} target="_blank">Repo</a>}
                {p.liveUrl && <a href={p.liveUrl} target="_blank">Live</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch(API_BASE + '/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch (e) {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="section">
      <h2>Contact</h2>
      <form className="form" onSubmit={onSubmit}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <textarea placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
        <button disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending...' : 'Send'}
        </button>
      </form>
      {status === 'success' && <p className="success">Thanks! We'll get back to you soon.</p>}
      {status === 'error' && <p className="error">Something went wrong. Try again.</p>}
    </section>
  )
}

export default function App() {
  useEffect(() => { document.title = 'Team Portfolio'; }, []);
  const { effectsOn, bgSpeed, bgDensity } = useSettings()
  return (
    <div className="container">
      {effectsOn && (
        <Suspense fallback={null}>
          <Particles speed={bgSpeed} density={bgDensity} enabled={effectsOn} />
        </Suspense>
      )}
      <Header />
      <main>
        <Team />
        <Projects />
        <Suspense fallback={<section className="section"><h2>Latest Updates</h2><p className="muted">Loading updates...</p></section>}><LatestUpdates /></Suspense>
        <Contact />
      </main>
      <footer className="footer">Copyright {new Date().getFullYear()} Our Team</footer>
    </div>
  )
}








