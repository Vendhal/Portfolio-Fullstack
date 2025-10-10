import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LatestUpdates from '../components/LatestUpdates'

describe('LatestUpdates', () => {
  it('should render the component with correct structure', () => {
    render(<LatestUpdates />)
    
    // Check main heading
    expect(screen.getByText('Latest Updates')).toBeInTheDocument()
    expect(screen.getByText("What's New")).toBeInTheDocument()
    expect(screen.getByText('Quick highlights from the team, fresh off the launch pad.')).toBeInTheDocument()
  })

  it('should render all update cards', () => {
    render(<LatestUpdates />)
    
    // Check that all three expected updates are rendered
    expect(screen.getByText('Galaxy-themed social buttons')).toBeInTheDocument()
    expect(screen.getByText('Per-member projects + caching prep')).toBeInTheDocument()
    expect(screen.getByText('Galaxy back home button')).toBeInTheDocument()
  })

  it('should display update metadata correctly', () => {
    render(<LatestUpdates />)
    
    // Check dates and authors
    expect(screen.getAllByText('Sep 19, 2025')).toHaveLength(3)
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('UX')).toBeInTheDocument()
  })

  it('should render update descriptions', () => {
    render(<LatestUpdates />)
    
    expect(screen.getByText(/Refined member actions with cosmic gradients/)).toBeInTheDocument()
    expect(screen.getByText(/Seeded individual project lists/)).toBeInTheDocument()
    expect(screen.getByText(/Replaced the text link with a glowing nebula-style/)).toBeInTheDocument()
  })

  it('should have proper semantic structure', () => {
    render(<LatestUpdates />)
    
    // Check semantic HTML structure
    const section = screen.getByRole('region')
    expect(section).toBeInTheDocument()
    
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
    
    // Each article should have a heading
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)
  })

  it('should have proper CSS classes for styling', () => {
    render(<LatestUpdates />)
    
    const section = screen.getByRole('region')
    expect(section).toHaveClass('latest')
    
    // Check for grid container
    const grid = section.querySelector('.latest-grid')
    expect(grid).toBeInTheDocument()
    
    // Check for card styling
    const cards = section.querySelectorAll('.latest-card')
    expect(cards).toHaveLength(3)
  })

  it('should include glow effects for visual enhancement', () => {
    render(<LatestUpdates />)
    
    const glowElements = screen.getAllByLabelText('', { hidden: true })
    // Each card should have a glow element
    const cardGlows = glowElements.filter(el => el.className === 'card-glow')
    expect(cardGlows.length).toBeGreaterThan(0)
  })

  it('should display meta information with bullet separator', () => {
    render(<LatestUpdates />)
    
    // Check for proper meta formatting with bullet separator
    const metaElements = screen.getAllByText(/Sep 19, 2025 • \w+/)
    expect(metaElements).toHaveLength(3)
  })
})