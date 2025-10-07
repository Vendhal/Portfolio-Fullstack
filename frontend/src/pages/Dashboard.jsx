import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'

const emptyExperience = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
  orderIndex: '',
}

const emptyProject = {
  title: '',
  summary: '',
  description: '',
  tags: '',
  repoUrl: '',
  liveUrl: '',
  imageUrl: '',
}

const toProfileForm = (summary) => ({
  displayName: summary?.name || '',
  slug: summary?.slug || '',
  headline: summary?.role || '',
  bio: summary?.bio || '',
  location: summary?.location || '',
  photoUrl: summary?.photoUrl || '',
  githubUrl: summary?.githubUrl || '',
  linkedinUrl: summary?.linkedinUrl || '',
  twitterUrl: summary?.twitterUrl || '',
  websiteUrl: summary?.websiteUrl || '',
})

async function readJson(response) {
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.warn('Failed to parse JSON', err)
    }
  }
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}

const toDateInputValue = (value) => (value ? value : '')

export default function Dashboard() {
  const { auth, isAuthenticated, login, register, logout, authorizedFetch, setProfileSummary } = useAuth()

  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', displayName: '', slug: '' })
  const [authError, setAuthError] = useState(null)

  const [profileData, setProfileData] = useState(null)
  const [profileForm, setProfileForm] = useState(() => toProfileForm(auth?.profile))
  const [profileMessage, setProfileMessage] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const [experienceForm, setExperienceForm] = useState(emptyExperience)
  const [editingExperienceId, setEditingExperienceId] = useState(null)
  const [experienceError, setExperienceError] = useState(null)

  const [projectForm, setProjectForm] = useState(emptyProject)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectError, setProjectError] = useState(null)

  const experiences = profileData?.experiences ?? []
  const projects = profileData?.projects ?? []

  const firstName = useMemo(() => auth?.profile?.name ? auth.profile.name.split(' ')[0] : null, [auth?.profile?.name])

  const resetExperienceForm = useCallback(() => {
    setExperienceForm(emptyExperience)
    setEditingExperienceId(null)
    setExperienceError(null)
  }, [])

  const resetProjectForm = useCallback(() => {
    setProjectForm(emptyProject)
    setEditingProjectId(null)
    setProjectError(null)
  }, [])

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfileData(null)
      return
    }
    setLoadingProfile(true)
    setProfileError(null)
    try {
      const res = await authorizedFetch('/profile/me')
      const data = await readJson(res)
      setProfileData(data)
      setProfileForm(toProfileForm(data?.profile))
      setProfileSummary(data?.profile || null)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setLoadingProfile(false)
    }
  }, [authorizedFetch, isAuthenticated, setProfileSummary])

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
    } else {
      setProfileData(null)
      setProfileForm(toProfileForm(null))
    }
  }, [isAuthenticated, loadProfile])

  useEffect(() => {
    setProfileForm(toProfileForm(auth?.profile))
  }, [auth?.profile])

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthError(null)
    try {
      await login(loginForm.email.trim(), loginForm.password)
      setLoginForm({ email: '', password: '' })
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setAuthError(null)
    const email = registerForm.email.trim()
    const password = registerForm.password
    const displayName = registerForm.displayName.trim()

    if (!email || !password || !displayName) {
      setAuthError('Email, password, and display name are required.')
      return
    }

    const payload = {
      email,
      password,
      slug: registerForm.slug.trim() || null,
      displayName,
      headline: null,
      bio: null,
      photoUrl: null,
      githubUrl: null,
      linkedinUrl: null,
      twitterUrl: null,
      websiteUrl: null,
      location: null,
    }

    try {
      await register(payload)
      setRegisterForm({ email: '', password: '', displayName: '', slug: '' })
      setMode('login')
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setProfileMessage(null)
    setProfileError(null)

    const displayName = profileForm.displayName.trim()
    if (!displayName) {
      setProfileError('Display name is required.')
      return
    }

    const payload = {
      slug: profileForm.slug.trim() || null,
      displayName,
      headline: profileForm.headline.trim() || null,
      bio: profileForm.bio.trim() || null,
      location: profileForm.location.trim() || null,
      photoUrl: profileForm.photoUrl.trim() || null,
      githubUrl: profileForm.githubUrl.trim() || null,
      linkedinUrl: profileForm.linkedinUrl.trim() || null,
      twitterUrl: profileForm.twitterUrl.trim() || null,
      websiteUrl: profileForm.websiteUrl.trim() || null,
    }

    try {
      const res = await authorizedFetch('/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const updated = await readJson(res)
      setProfileSummary(updated || null)
      setProfileMessage('Profile updated successfully.')
      setProfileData(prev => prev ? { ...prev, profile: updated } : prev)
    } catch (err) {
      setProfileError(err.message)
    }
  }

  const startExperienceEdit = (exp) => {
    setExperienceForm({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: toDateInputValue(exp.startDate),
      endDate: toDateInputValue(exp.endDate),
      current: Boolean(exp.current),
      description: exp.description || '',
      orderIndex: exp.orderIndex ?? '',
    })
    setEditingExperienceId(exp.id)
    setExperienceError(null)
  }

  const handleExperienceSubmit = async (event) => {
    event.preventDefault()
    setExperienceError(null)
    if (!experienceForm.title.trim()) {
      setExperienceError('Title is required.')
      return
    }

    const payload = {
      title: experienceForm.title.trim(),
      company: experienceForm.company.trim() || null,
      location: experienceForm.location.trim() || null,
      startDate: experienceForm.startDate || null,
      endDate: experienceForm.current ? null : (experienceForm.endDate || null),
      current: Boolean(experienceForm.current),
      description: experienceForm.description.trim() || null,
      orderIndex: experienceForm.orderIndex === '' ? null : Number(experienceForm.orderIndex),
    }

    try {
      const url = editingExperienceId ? `/profile/me/experiences/${editingExperienceId}` : '/profile/me/experiences'
      const res = await authorizedFetch(url, {
        method: editingExperienceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      await readJson(res)
      resetExperienceForm()
      await loadProfile()
    } catch (err) {
      setExperienceError(err.message)
    }
  }

  const handleExperienceDelete = async (id) => {
    setExperienceError(null)
    try {
      const res = await authorizedFetch(`/profile/me/experiences/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        await readJson(res)
      }
      if (editingExperienceId === id) {
        resetExperienceForm()
      }
      await loadProfile()
    } catch (err) {
      setExperienceError(err.message)
    }
  }

  const startProjectEdit = (project) => {
    setProjectForm({
      title: project.title || '',
      summary: project.summary || '',
      description: project.description || '',
      tags: project.tags || '',
      repoUrl: project.repoUrl || '',
      liveUrl: project.liveUrl || '',
      imageUrl: project.imageUrl || '',
    })
    setEditingProjectId(project.id)
    setProjectError(null)
  }

  const handleProjectSubmit = async (event) => {
    event.preventDefault()
    setProjectError(null)
    if (!projectForm.title.trim()) {
      setProjectError('Title is required.')
      return
    }

    const payload = {
      title: projectForm.title.trim(),
      summary: projectForm.summary.trim() || null,
      description: projectForm.description.trim() || null,
      tags: projectForm.tags.trim() || null,
      repoUrl: projectForm.repoUrl.trim() || null,
      liveUrl: projectForm.liveUrl.trim() || null,
      imageUrl: projectForm.imageUrl.trim() || null,
    }

    try {
      const url = editingProjectId ? `/profile/me/projects/${editingProjectId}` : '/profile/me/projects'
      const res = await authorizedFetch(url, {
        method: editingProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      await readJson(res)
      resetProjectForm()
      await loadProfile()
    } catch (err) {
      setProjectError(err.message)
    }
  }

  const handleProjectDelete = async (id) => {
    setProjectError(null)
    try {
      const res = await authorizedFetch(`/profile/me/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        await readJson(res)
      }
      if (editingProjectId === id) {
        resetProjectForm()
      }
      await loadProfile()
    } catch (err) {
      setProjectError(err.message)
    }
  }

  const formatRange = (start, end, current) => {
    if (!start && !end) return current ? 'Current' : ''
    const startLabel = start || 'Unknown'
    const endLabel = current ? 'Present' : (end || 'Unknown')
    return `${startLabel} – ${endLabel}`
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="auth-card">
          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setAuthError(null) }}>Login</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setAuthError(null) }}>Register</button>
          </div>

          {authError && <p className="error" role="alert">{authError}</p>}

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
              </label>
              <label>
                Password
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
              </label>
              <button type="submit">Sign In</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                Email
                <input type="email" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required />
              </label>
              <label>
                Password
                <input type="password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required />
              </label>
              <label>
                Display name
                <input value={registerForm.displayName} onChange={e => setRegisterForm({ ...registerForm, displayName: e.target.value })} required />
              </label>
              <label>
                Profile slug (optional)
                <input value={registerForm.slug} onChange={e => setRegisterForm({ ...registerForm, slug: e.target.value })} placeholder="my-awesome-portfolio" />
              </label>
              <button type="submit">Create Account</button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container dashboard" style={{ paddingTop: 32 }}>
      <header className="dashboard-header">
        <div>
          <h2>Portfolio Dashboard</h2>
          {firstName && <p className="muted">Welcome back, {firstName}!</p>}
        </div>
        <button type="button" className="logout-btn" onClick={logout}>Log out</button>
      </header>

      {profileError && <p className="error" role="alert">{profileError}</p>}
      {profileMessage && <p className="success">{profileMessage}</p>}

      <section className="dashboard-section">
        <h3>Profile</h3>
        <form className="dashboard-form" onSubmit={handleProfileSubmit}>
          <div className="form-grid">
            <label>
              Display name
              <input value={profileForm.displayName} onChange={e => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))} required />
            </label>
            <label>
              Slug
              <input value={profileForm.slug} onChange={e => setProfileForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="unique-profile-slug" />
            </label>
            <label>
              Headline
              <input value={profileForm.headline} onChange={e => setProfileForm(prev => ({ ...prev, headline: e.target.value }))} placeholder="Full-Stack Developer" />
            </label>
            <label>
              Location
              <input value={profileForm.location} onChange={e => setProfileForm(prev => ({ ...prev, location: e.target.value }))} placeholder="Remote" />
            </label>
            <label>
              Photo URL
              <input value={profileForm.photoUrl} onChange={e => setProfileForm(prev => ({ ...prev, photoUrl: e.target.value }))} placeholder="https://" />
            </label>
            <label>
              GitHub
              <input value={profileForm.githubUrl} onChange={e => setProfileForm(prev => ({ ...prev, githubUrl: e.target.value }))} placeholder="https://github.com/username" />
            </label>
            <label>
              LinkedIn
              <input value={profileForm.linkedinUrl} onChange={e => setProfileForm(prev => ({ ...prev, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/username" />
            </label>
            <label>
              Twitter
              <input value={profileForm.twitterUrl} onChange={e => setProfileForm(prev => ({ ...prev, twitterUrl: e.target.value }))} placeholder="https://twitter.com/username" />
            </label>
            <label>
              Website
              <input value={profileForm.websiteUrl} onChange={e => setProfileForm(prev => ({ ...prev, websiteUrl: e.target.value }))} placeholder="https://example.com" />
            </label>
          </div>
          <label>
            Bio
            <textarea rows="4" value={profileForm.bio} onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell visitors about yourself" />
          </label>
          <button type="submit" disabled={loadingProfile}>Save profile</button>
        </form>
      </section>

      <section className="dashboard-section">
        <h3>Experiences</h3>
        <form className="dashboard-form" onSubmit={handleExperienceSubmit}>
          <div className="form-grid">
            <label>
              Title
              <input value={experienceForm.title} onChange={e => setExperienceForm({ ...experienceForm, title: e.target.value })} required />
            </label>
            <label>
              Company
              <input value={experienceForm.company} onChange={e => setExperienceForm({ ...experienceForm, company: e.target.value })} />
            </label>
            <label>
              Location
              <input value={experienceForm.location} onChange={e => setExperienceForm({ ...experienceForm, location: e.target.value })} />
            </label>
            <label>
              Start date
              <input type="date" value={experienceForm.startDate} onChange={e => setExperienceForm({ ...experienceForm, startDate: e.target.value })} />
            </label>
            <label>
              End date
              <input type="date" value={experienceForm.endDate} onChange={e => setExperienceForm({ ...experienceForm, endDate: e.target.value })} disabled={experienceForm.current} />
            </label>
            <label>
              Order
              <input type="number" value={experienceForm.orderIndex} onChange={e => setExperienceForm({ ...experienceForm, orderIndex: e.target.value })} placeholder="0" />
            </label>
          </div>
          <label className="checkbox-inline">
            <input type="checkbox" checked={experienceForm.current} onChange={e => setExperienceForm({ ...experienceForm, current: e.target.checked })} />
            Current role
          </label>
          <label>
            Description
            <textarea rows="3" value={experienceForm.description} onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} />
          </label>
          {experienceError && <p className="error">{experienceError}</p>}
          <div className="form-actions">
            <button type="submit">{editingExperienceId ? 'Update experience' : 'Add experience'}</button>
            {editingExperienceId && <button type="button" className="link-button" onClick={resetExperienceForm}>Cancel</button>}
          </div>
        </form>

        <div className="dashboard-list">
          {experiences.length === 0 ? (
            <p className="muted">No experiences yet.</p>
          ) : (
            experiences.map(exp => (
              <article key={exp.id} className="dashboard-item">
                <header>
                  <div>
                    <strong>{exp.title}</strong>{exp.company && <span className="muted"> @ {exp.company}</span>}
                  </div>
                  <span className="muted">{formatRange(exp.startDate, exp.endDate, exp.current)}</span>
                </header>
                {exp.description && <p className="subtle">{exp.description}</p>}
                <div className="item-actions">
                  <button type="button" className="link-button" onClick={() => startExperienceEdit(exp)}>Edit</button>
                  <button type="button" className="link-button danger" onClick={() => handleExperienceDelete(exp.id)}>Delete</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Projects</h3>
        <form className="dashboard-form" onSubmit={handleProjectSubmit}>
          <div className="form-grid">
            <label>
              Title
              <input value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} required />
            </label>
            <label>
              Summary
              <input value={projectForm.summary} onChange={e => setProjectForm({ ...projectForm, summary: e.target.value })} />
            </label>
            <label>
              Tags
              <input value={projectForm.tags} onChange={e => setProjectForm({ ...projectForm, tags: e.target.value })} placeholder="react, spring" />
            </label>
            <label>
              Repo URL
              <input value={projectForm.repoUrl} onChange={e => setProjectForm({ ...projectForm, repoUrl: e.target.value })} placeholder="https://github.com/..." />
            </label>
            <label>
              Live URL
              <input value={projectForm.liveUrl} onChange={e => setProjectForm({ ...projectForm, liveUrl: e.target.value })} placeholder="https://" />
            </label>
            <label>
              Image URL
              <input value={projectForm.imageUrl} onChange={e => setProjectForm({ ...projectForm, imageUrl: e.target.value })} placeholder="https://" />
            </label>
          </div>
          <label>
            Description
            <textarea rows="3" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
          </label>
          {projectError && <p className="error">{projectError}</p>}
          <div className="form-actions">
            <button type="submit">{editingProjectId ? 'Update project' : 'Add project'}</button>
            {editingProjectId && <button type="button" className="link-button" onClick={resetProjectForm}>Cancel</button>}
          </div>
        </form>

        <div className="dashboard-list">
          {projects.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            projects.map(project => (
              <article key={project.id} className="dashboard-item">
                <header>
                  <div>
                    <strong>{project.title}</strong>
                  </div>
                  {project.tags && <span className="muted">{project.tags}</span>}
                </header>
                {project.summary && <p className="subtle">{project.summary}</p>}
                <div className="item-actions">
                  <button type="button" className="link-button" onClick={() => startProjectEdit(project)}>Edit</button>
                  <button type="button" className="link-button danger" onClick={() => handleProjectDelete(project.id)}>Delete</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
