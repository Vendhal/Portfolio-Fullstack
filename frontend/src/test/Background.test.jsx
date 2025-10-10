import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Background from '../components/Background'

// Mock the requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // 60fps
})

describe('Background', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.requestAnimationFrame = mockRequestAnimationFrame
  })

  it('should render canvas element', () => {
    render(<Background />)
    
    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
  })

  it('should have correct canvas attributes', () => {
    render(<Background />)
    
    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas).toHaveClass('background-canvas')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })

  it('should handle canvas context creation', () => {
    // Mock canvas context
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
    }

    const mockGetContext = vi.fn(() => mockContext)
    HTMLCanvasElement.prototype.getContext = mockGetContext

    render(<Background />)
    
    expect(mockGetContext).toHaveBeenCalledWith('2d')
  })

  it('should initialize canvas dimensions', () => {
    render(<Background />)
    
    const canvas = screen.getByRole('img', { hidden: true })
    
    // Canvas should have dimensions set
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)
  })

  it('should handle window resize events', () => {
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight

    render(<Background />)
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
    
    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas.width).toBe(1920)
    expect(canvas.height).toBe(1080)

    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    const { unmount } = render(<Background />)
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })

  it('should handle missing canvas context gracefully', () => {
    // Mock getContext to return null
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null)
    
    // Should not throw an error
    expect(() => render(<Background />)).not.toThrow()
  })

  it('should create and animate particles', async () => {
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
    }

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext)

    render(<Background />)
    
    // Wait for animation frame
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Verify that drawing operations are called
    expect(mockContext.clearRect).toHaveBeenCalled()
    expect(mockContext.fillRect).toHaveBeenCalled()
  })

  it('should use proper CSS positioning', () => {
    render(<Background />)
    
    const canvas = screen.getByRole('img', { hidden: true })
    const computedStyle = getComputedStyle(canvas)
    
    // Canvas should be positioned fixed to cover entire viewport
    expect(canvas).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      'z-index': '-1'
    })
  })
})