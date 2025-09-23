import './LatestUpdates.css'

const updates = [
  {
    title: 'Galaxy-themed social buttons',
    date: 'Sep 19, 2025',
    author: 'Frontend',
    description: 'Refined member actions with cosmic gradients, icons, and consistent styling across GitHub, LinkedIn, and Twitter buttons.'
  },
  {
    title: 'Per-member projects + caching prep',
    date: 'Sep 19, 2025',
    author: 'Backend',
    description: 'Seeded individual project lists for each teammate and refreshed serializers to avoid proxy issues when returning owners.'
  },
  {
    title: 'Galaxy back home button',
    date: 'Sep 19, 2025',
    author: 'UX',
    description: 'Replaced the text link with a glowing nebula-style CTA that animates on hover and respects reduced-motion.'
  }
]

export default function LatestUpdates() {
  return (
    <section className="latest">
      <div className="latest-header">
        <span className="latest-kicker">What&apos;s New</span>
        <h2 className="latest-title">Latest Updates</h2>
        <p className="latest-sub">Quick highlights from the team, fresh off the launch pad.</p>
      </div>
      <div className="latest-grid">
        {updates.map((u, i) => (
          <article key={i} className="latest-card" style={{ '--card-index': i }}>
            <div className="card-glow" aria-hidden />
            <header>
              <h3>{u.title}</h3>
              <p className="meta">{u.date} · {u.author}</p>
            </header>
            <p className="blurb">{u.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
