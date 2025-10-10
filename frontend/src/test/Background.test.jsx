import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Background from '../components/Background'

describe('Background', () => {
  beforeEach(() => {
    // Clear any previous renders
  })

  it('should render background container', () => {
    render(<Background />)
    
    const container = screen.getByRole('generic', { hidden: true })
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('bg-effects')
  })

  it('should render gradient background', () => {
    render(<Background />)
    
    const gradient = document.querySelector('.bg-gradient')
    expect(gradient).toBeInTheDocument()
  })

  it('should render orb elements', () => {
    render(<Background />)
    
    const orbs = document.querySelectorAll('.orb')
    expect(orbs).toHaveLength(5)
    
    // Check that all orbs have the correct classes
    expect(document.querySelector('.orb.o1')).toBeInTheDocument()
    expect(document.querySelector('.orb.o2')).toBeInTheDocument()
    expect(document.querySelector('.orb.o3')).toBeInTheDocument()
    expect(document.querySelector('.orb.o4')).toBeInTheDocument()
    expect(document.querySelector('.orb.o5')).toBeInTheDocument()
  })

  it('should have aria-hidden attribute', () => {
    render(<Background />)
    
    const container = screen.getByRole('generic', { hidden: true })
    expect(container).toHaveAttribute('aria-hidden')
  })

  it('should have correct container class', () => {
    render(<Background />)
    
    const container = document.querySelector('.bg-effects')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('bg-effects')
  })

  it('should render all visual elements', () => {
    render(<Background />)
    
    // Check for main container
    expect(document.querySelector('.bg-effects')).toBeInTheDocument()
    
    // Check for gradient
    expect(document.querySelector('.bg-gradient')).toBeInTheDocument()
    
    // Check for all orbs
    for (let i = 1; i <= 5; i++) {
      expect(document.querySelector(`.orb.o${i}`)).toBeInTheDocument()
    }
  })

  it('should use span elements for orbs', () => {
    render(<Background />)
    
    const orbs = document.querySelectorAll('.orb')
    orbs.forEach(orb => {
      expect(orb.tagName).toBe('SPAN')
    })
  })

  it('should use div for gradient', () => {
    render(<Background />)
    
    const gradient = document.querySelector('.bg-gradient')
    expect(gradient.tagName).toBe('DIV')
  })

  it('should have proper container structure', () => {
    render(<Background />)
    
    const container = document.querySelector('.bg-effects')
    expect(container.children).toHaveLength(6) // 1 gradient + 5 orbs
  })
})