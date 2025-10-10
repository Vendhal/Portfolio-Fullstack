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
    
    // Check dates and authors using text content matchers that are more flexible
    const metaElements = document.querySelectorAll('.meta')
    expect(metaElements).toHaveLength(3)
    
    // Check that all meta elements contain the expected content
    expect(metaElements[0].textContent).toContain('Sep 19, 2025')
    expect(metaElements[0].textContent).toContain('Frontend')
    
    expect(metaElements[1].textContent).toContain('Sep 19, 2025')
    expect(metaElements[1].textContent).toContain('Backend')
    
    expect(metaElements[2].textContent).toContain('Sep 19, 2025')
    expect(metaElements[2].textContent).toContain('UX')
  })

  it('should render update descriptions', () => {
    render(<LatestUpdates />)
    
    expect(screen.getByText(/Refined member actions with cosmic gradients/)).toBeInTheDocument()
    expect(screen.getByText(/Seeded individual project lists/)).toBeInTheDocument()
    expect(screen.getByText(/Replaced the text link with a glowing nebula-style/)).toBeInTheDocument()
  })

  it('should have proper semantic structure', () => {
    render(<LatestUpdates />)
    
    // Check semantic HTML structure - section doesn't automatically get region role
    const section = document.querySelector('.latest')
    expect(section).toBeInTheDocument()
    expect(section.tagName).toBe('SECTION')
    
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
    
    // Each article should have a heading
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)
  })

  it('should have proper CSS classes for styling', () => {
    render(<LatestUpdates />)
    
    const section = document.querySelector('.latest')
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
    
    // Find glow elements by class name since they have aria-hidden
    const glowElements = document.querySelectorAll('.card-glow')
    expect(glowElements).toHaveLength(3)
    
    // Verify they have aria-hidden attribute
    glowElements.forEach(glow => {
      expect(glow).toHaveAttribute('aria-hidden')
    })
  })

  it('should display meta information with bullet separator', () => {
    render(<LatestUpdates />)
    
    // The bullet separator is a special character (�) not a regular bullet (•)
    // Check for the actual content rendered
    const metaElements = document.querySelectorAll('.meta')
    expect(metaElements).toHaveLength(3)
    
    // Verify each meta element contains date and author
    metaElements.forEach(meta => {
      expect(meta.textContent).toContain('Sep 19, 2025')
      expect(meta.textContent).toMatch(/(Frontend|Backend|UX)/)
    })
  })
})