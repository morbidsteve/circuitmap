import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PanelView } from './PanelView'
import { Breaker } from '@/types/panel'

// Mock dnd-kit since it requires complex setup
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSensor: () => ({}),
  useSensors: () => [],
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: () => {},
  }),
  MouseSensor: {},
  TouchSensor: {},
  closestCenter: () => {},
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Translate: {
      toString: () => '',
    },
  },
}))

const createBreaker = (overrides: Partial<Breaker> = {}): Breaker => ({
  id: crypto.randomUUID(),
  panelId: 'test-panel',
  position: '1',
  amperage: 20,
  poles: 1,
  label: 'Test Breaker',
  circuitType: 'general',
  protectionType: 'standard',
  isOn: true,
  sortOrder: 1,
  createdAt: new Date(),
  ...overrides,
})

describe('PanelView', () => {
  describe('Basic rendering', () => {
    it('renders panel with main amperage', () => {
      render(
        <PanelView
          breakers={[]}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('200A')).toBeInTheDocument()
      expect(screen.getByText(/200A Main/)).toBeInTheDocument()
    })

    it('renders panel with total slots count', () => {
      render(
        <PanelView
          breakers={[]}
          totalSlots={40}
          mainAmperage={200}
        />
      )

      expect(screen.getByText(/40 Slots/)).toBeInTheDocument()
    })

    it('renders panel with breaker count', () => {
      const breakers = [
        createBreaker({ position: '1', label: 'Kitchen' }),
        createBreaker({ position: '2', label: 'Bedroom' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText(/2 Breakers/)).toBeInTheDocument()
    })

    it('displays legend with circuit types', () => {
      render(
        <PanelView
          breakers={[]}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('General')).toBeInTheDocument()
      expect(screen.getByText('Lighting')).toBeInTheDocument()
      expect(screen.getByText('Kitchen')).toBeInTheDocument()
      expect(screen.getByText('HVAC')).toBeInTheDocument()
      expect(screen.getByText('GFCI')).toBeInTheDocument()
      expect(screen.getByText('AFCI')).toBeInTheDocument()
      expect(screen.getByText('Tandem')).toBeInTheDocument()
    })
  })

  describe('Single breaker display', () => {
    it('renders a single-pole breaker at position 1 (left side)', () => {
      const breakers = [
        createBreaker({ position: '1', amperage: 20, label: 'Kitchen Outlets' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Kitchen Outlets')).toBeInTheDocument()
      // Check breaker count includes this breaker
      expect(screen.getByText(/1 Breaker/)).toBeInTheDocument()
    })

    it('renders a single-pole breaker at position 2 (right side)', () => {
      const breakers = [
        createBreaker({ position: '2', amperage: 15, label: 'Bedroom Lights' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Bedroom Lights')).toBeInTheDocument()
      // Check breaker count includes this breaker
      expect(screen.getByText(/1 Breaker/)).toBeInTheDocument()
    })
  })

  describe('Multi-pole breaker display', () => {
    it('renders a double-pole breaker with range position (1-3)', () => {
      const breakers = [
        createBreaker({ position: '1-3', amperage: 30, poles: 2, label: 'Dryer' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Dryer')).toBeInTheDocument()
      expect(screen.getByText(/1 Breaker/)).toBeInTheDocument()
    })
  })

  describe('Tandem breaker - individual positions (14A, 14B)', () => {
    it('renders tandem breakers at same slot with separate A/B positions', () => {
      const breakers = [
        createBreaker({ position: '14A', amperage: 15, label: 'Bath Fan' }),
        createBreaker({ position: '14B', amperage: 15, label: 'Hall Lights' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={40}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Bath Fan')).toBeInTheDocument()
      expect(screen.getByText('Hall Lights')).toBeInTheDocument()
    })

    it('groups tandem breakers correctly for odd positions', () => {
      const breakers = [
        createBreaker({ position: '1A', amperage: 15, label: 'Circuit A' }),
        createBreaker({ position: '1B', amperage: 15, label: 'Circuit B' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Circuit A')).toBeInTheDocument()
      expect(screen.getByText('Circuit B')).toBeInTheDocument()
      // Check for tandem indicator
      expect(screen.getAllByText('T').length).toBeGreaterThan(0)
    })

    it('handles lowercase tandem suffixes (1a, 1b)', () => {
      const breakers = [
        createBreaker({ position: '2a', amperage: 20, label: 'Office' }),
        createBreaker({ position: '2b', amperage: 20, label: 'Den' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getByText('Office')).toBeInTheDocument()
      expect(screen.getByText('Den')).toBeInTheDocument()
    })
  })

  describe('Tandem breaker - combined format (14A/14B)', () => {
    it('renders combined tandem format as two half-slots', () => {
      const breakers = [
        createBreaker({ position: '14A/14B', amperage: 15, label: 'Tandem Circuit' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={40}
          mainAmperage={200}
        />
      )

      // Should show the label in both halves since it's one breaker
      expect(screen.getAllByText('Tandem Circuit').length).toBe(2)
    })

    it('handles combined tandem at even position', () => {
      const breakers = [
        createBreaker({ position: '2A/2B', amperage: 20, label: 'Garage Tandem' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getAllByText('Garage Tandem').length).toBe(2)
    })

    it('handles mixed case combined format (14a/14B)', () => {
      const breakers = [
        createBreaker({ position: '8a/8B', amperage: 15, label: 'Mixed Case' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      expect(screen.getAllByText('Mixed Case').length).toBe(2)
    })
  })

  describe('Breaker interactions', () => {
    it('calls onBreakerClick when a breaker is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()
      const breakers = [
        createBreaker({ id: 'breaker-1', position: '1', label: 'Clickable' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
          onBreakerClick={mockOnClick}
        />
      )

      await user.click(screen.getByText('Clickable'))
      expect(mockOnClick).toHaveBeenCalledWith('breaker-1')
    })

    it('highlights selected breaker', () => {
      const breakers = [
        createBreaker({ id: 'breaker-1', position: '1', label: 'Selected Breaker' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
          selectedBreakerId="breaker-1"
        />
      )

      // Selected breaker should have ring styling
      const breakerElement = screen.getByText('Selected Breaker').closest('div')
      expect(breakerElement).toBeInTheDocument()
    })

    it('renders empty slots when no breakers provided', () => {
      const mockOnEmptyClick = vi.fn()

      render(
        <PanelView
          breakers={[]}
          totalSlots={4}
          mainAmperage={200}
          onEmptySlotClick={mockOnEmptyClick}
        />
      )

      // Empty slots should be rendered with dashed border styling
      const panel = screen.getByText('Electrical Panel')
      expect(panel).toBeInTheDocument()
      // Verify empty state - panel renders without breakers
      expect(screen.getByText(/0 Breakers/)).toBeInTheDocument()
    })
  })

  describe('Protection types display', () => {
    it('shows GFCI protection badge', () => {
      const breakers = [
        createBreaker({ position: '1', protectionType: 'gfci', label: 'GFCI Outlet' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      // Should have a 'G' badge for GFCI
      expect(screen.getAllByText('G').length).toBeGreaterThan(0)
    })

    it('shows AFCI protection badge', () => {
      const breakers = [
        createBreaker({ position: '1', protectionType: 'afci', label: 'AFCI Circuit' }),
      ]

      render(
        <PanelView
          breakers={breakers}
          totalSlots={20}
          mainAmperage={200}
        />
      )

      // Should have an 'A' badge for AFCI
      expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    })
  })
})
