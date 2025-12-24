import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BreakerSlot } from './BreakerSlot'
import type { Breaker } from '@/types/panel'

const createMockBreaker = (overrides: Partial<Breaker> = {}): Breaker => ({
  id: 'breaker-1',
  panelId: 'panel-1',
  position: '1',
  amperage: 20,
  poles: 1,
  label: 'Kitchen Outlets',
  circuitType: 'general',
  protectionType: 'standard',
  isOn: true,
  createdAt: new Date(),
  ...overrides,
})

describe('BreakerSlot component', () => {
  describe('empty slot (knockout)', () => {
    it('renders empty slot when no breaker provided', () => {
      render(<BreakerSlot position={1} side="left" />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('renders with dashed border for knockout', () => {
      const { container } = render(<BreakerSlot position={2} side="left" />)
      const knockout = container.querySelector('.border-dashed')
      expect(knockout).toBeInTheDocument()
    })
  })

  describe('with breaker', () => {
    it('displays breaker amperage', () => {
      const breaker = createMockBreaker({ amperage: 30 })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('displays breaker label', () => {
      const breaker = createMockBreaker({ label: 'Master Bedroom' })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('Master Bedroom')).toBeInTheDocument()
    })

    it('handles click events', () => {
      const handleClick = vi.fn()
      const breaker = createMockBreaker()
      render(
        <BreakerSlot breaker={breaker} position={1} side="left" onClick={handleClick} />
      )

      const slot = screen.getByText('Kitchen Outlets').closest('div[class*="cursor-pointer"]')
      fireEvent.click(slot!)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('displays selected state', () => {
      const breaker = createMockBreaker()
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" isSelected />
      )
      expect(container.querySelector('.ring-primary')).toBeInTheDocument()
    })

    it('shows pole count for multi-pole breakers', () => {
      const breaker = createMockBreaker({ poles: 2 })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('2-pole')).toBeInTheDocument()
    })

    it('does not show pole count for single-pole breakers', () => {
      const breaker = createMockBreaker({ poles: 1 })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.queryByText('1-pole')).not.toBeInTheDocument()
    })
  })

  describe('circuit type colors', () => {
    it('applies blue color for general circuits', () => {
      const breaker = createMockBreaker({ circuitType: 'general' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-blue-500')).toBeInTheDocument()
    })

    it('applies yellow color for lighting circuits', () => {
      const breaker = createMockBreaker({ circuitType: 'lighting' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()
    })

    it('applies red color for appliance circuits', () => {
      const breaker = createMockBreaker({ circuitType: 'appliance' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
    })

    it('applies purple color for HVAC circuits', () => {
      const breaker = createMockBreaker({ circuitType: 'hvac' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument()
    })

    it('applies green color for outdoor circuits', () => {
      const breaker = createMockBreaker({ circuitType: 'outdoor' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
    })

    it('applies gray color for unknown circuit types', () => {
      const breaker = createMockBreaker({ circuitType: 'unknown' })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.bg-gray-500')).toBeInTheDocument()
    })
  })

  describe('protection type badges', () => {
    it('shows G badge for GFCI protection', () => {
      const breaker = createMockBreaker({ protectionType: 'gfci' })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('G')).toBeInTheDocument()
    })

    it('shows A badge for AFCI protection', () => {
      const breaker = createMockBreaker({ protectionType: 'afci' })
      const { container } = render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      // Find the badge specifically (not the amperage "A" unit)
      const badge = container.querySelector('.absolute.top-0.right-0')
      expect(badge).toBeInTheDocument()
      expect(badge?.textContent).toBe('A')
    })

    it('shows D badge for dual function protection', () => {
      const breaker = createMockBreaker({ protectionType: 'dual_function' })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('D')).toBeInTheDocument()
    })

    it('does not show badge for standard protection', () => {
      const breaker = createMockBreaker({ protectionType: 'standard' })
      const { container } = render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      // The badge container should not exist for standard protection
      const badge = container.querySelector('.absolute.top-0.right-0')
      expect(badge).not.toBeInTheDocument()
    })
  })

  describe('on/off state', () => {
    it('shows | indicator when breaker is on', () => {
      const breaker = createMockBreaker({ isOn: true })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('|')).toBeInTheDocument()
    })

    it('shows ○ indicator when breaker is off', () => {
      const breaker = createMockBreaker({ isOn: false })
      render(<BreakerSlot breaker={breaker} position={1} side="left" />)
      expect(screen.getByText('○')).toBeInTheDocument()
    })

    it('applies dimmed styling when breaker is off', () => {
      const breaker = createMockBreaker({ isOn: false })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.opacity-70')).toBeInTheDocument()
    })
  })

  describe('layout and alignment', () => {
    it('aligns content to left for left-side slots', () => {
      const breaker = createMockBreaker()
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      // Should not have ml-auto on the breaker element
      const breakerDiv = container.querySelector('.w-20')
      expect(breakerDiv).not.toHaveClass('ml-auto')
    })

    it('aligns content to right for right-side slots', () => {
      const breaker = createMockBreaker()
      const { container } = render(
        <BreakerSlot breaker={breaker} position={2} side="right" />
      )
      // Should have ml-auto on the breaker element
      const breakerDiv = container.querySelector('.w-20')
      expect(breakerDiv).toHaveClass('ml-auto')
    })

    it('has increased height for multi-pole breakers', () => {
      const breaker = createMockBreaker({ poles: 2 })
      const { container } = render(
        <BreakerSlot breaker={breaker} position={1} side="left" />
      )
      expect(container.querySelector('.h-24')).toBeInTheDocument()
    })
  })
})
