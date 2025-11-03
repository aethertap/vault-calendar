import { render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Calendar, Event } from '../calendar';
import { DateTime } from 'luxon';
import { vi, type Mock } from 'vitest';

describe('Calendar Component', () => {
  // Helper function to create a mock DataView API
  const createMockDvApi = (mockQueryFn?: Mock) => ({
    query: mockQueryFn || vi.fn().mockResolvedValue({
      successful: true,
      value: { values: [] }
    }),
    pages: vi.fn().mockResolvedValue({
      file: {
        tasks: {
          where: vi.fn().mockReturnThis(),
          forEach: vi.fn()
        }
      }
    })
  });

  // Helper function to create mock DataView query results
  const createMockEvent = (text: string, date?: string, customValue?: any) => ({
    text: date ? `${text} [[${date}]]` : text,
    key: {
      path: 'test/file.md',
      toFile: () => ({ obsidianLink: () => 'test/file.md' })
    },
    value: customValue
  });

  describe('Basic Rendering', () => {
    it('should render loading state initially', () => {
      const [modified] = createSignal(0);
      const mockApi = createMockDvApi();

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
    });

    it('should render calendar grid after loading', async () => {
      const [modified] = createSignal(0);
      const mockApi = createMockDvApi();

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source=""
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
      });
    });
  });

  describe('Event Display', () => {
    it('should display events from DataView query', async () => {
      const [modified] = createSignal(0);
      const mockQuery = vi.fn().mockResolvedValue({
        successful: true,
        value: {
          values: [
            createMockEvent('Team Meeting', '2025-03-15'),
            createMockEvent('Code Review', '2025-03-16')
          ]
        }
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
        expect(screen.getByText(/Code Review/)).toBeInTheDocument();
      });

      expect(mockQuery).toHaveBeenCalledWith('some query');
    });

    it('should display events with custom output objects', async () => {
      const [modified] = createSignal(0);
      const mockQuery = vi.fn().mockResolvedValue({
        successful: true,
        value: {
          values: [
            createMockEvent('Original text', null, {
              start: DateTime.fromISO('2025-03-20'),
              end: DateTime.fromISO('2025-03-22'),
              display: 'Custom Display Text',
              link: 'custom/path.md'
            })
          ]
        }
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      // Event spans 3 days (March 20-22), so it should appear 3 times
      await waitFor(() => {
        const elements = screen.getAllByText(/Custom Display Text/);
        expect(elements).toHaveLength(3);
      });
    });

    it('should strip date patterns from display text', async () => {
      const [modified] = createSignal(0);
      const mockQuery = vi.fn().mockResolvedValue({
        successful: true,
        value: {
          values: [
            createMockEvent('Meeting on 2025-03-15', '2025-03-15')
          ]
        }
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        const text = screen.getByText(/Meeting on/);
        expect(text.textContent).not.toContain('2025-03-15');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when query fails', async () => {
      const [modified] = createSignal(0);
      const mockQuery = vi.fn().mockResolvedValue({
        successful: false,
        error: 'Invalid query syntax'
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="bad query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid query syntax/)).toBeInTheDocument();
      });
    });
  });

  describe('Reactive Updates', () => {
    it('should refetch events when modified signal changes', async () => {
      const [modified, setModified] = createSignal(0);
      const mockQuery = vi.fn().mockResolvedValue({
        successful: true,
        value: { values: [] }
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });

      // Trigger refetch
      setModified(1);

      await waitFor(() => {
        expect(mockQuery).toHaveBeenCalledTimes(2);
      });
    });

    it('should update displayed events after refetch', async () => {
      const [modified, setModified] = createSignal(0);
      let callCount = 0;
      const mockQuery = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          successful: true,
          value: {
            values: callCount === 1
              ? [createMockEvent('First Event', '2025-03-15')]
              : [createMockEvent('Updated Event', '2025-03-16')]
          }
        });
      });
      const mockApi = createMockDvApi(mockQuery);

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source="some query"
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/First Event/)).toBeInTheDocument();
      });

      // Trigger refetch
      setModified(1);

      await waitFor(() => {
        expect(screen.getByText(/Updated Event/)).toBeInTheDocument();
      });
    });
  });

  describe('Default Behavior (No Source)', () => {
    it('should use pages() when no dv_source provided', async () => {
      const [modified] = createSignal(0);
      const mockPages = vi.fn().mockResolvedValue({
        file: {
          tasks: {
            where: vi.fn().mockReturnThis(),
            forEach: vi.fn()
          }
        }
      });
      const mockApi = {
        query: vi.fn(),
        pages: mockPages
      };

      render(() =>
        <Calendar
          config=""
          month={3}
          year={2025}
          dv_source=""
          modified={modified}
          sourcePath="/test"
          container={null}
          dv_api={mockApi}
        />
      );

      await waitFor(() => {
        expect(mockPages).toHaveBeenCalled();
        expect(mockApi.query).not.toHaveBeenCalled();
      });
    });
  });
});
