import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PRAnalytics from '../PRAnalytics';
import { useAuth } from '../../context/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Auth Context
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('PRAnalytics Component', () => {
  const mockAccessToken = 'fake-token';

  beforeEach(() => {
    (useAuth as any).mockReturnValue({ accessToken: mockAccessToken });
    global.fetch = vi.fn();
  });

  it('renders loading state initially', async () => {
    // Setup a fetch that doesn't resolve immediately to catch the loading state
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    
    render(<PRAnalytics />);
    expect(screen.getByText(/Loading pull request intelligence/i)).toBeInTheDocument();
  });

  it('renders metrics from summary API and handles repository listing', async () => {
    const mockRepos = [
      { id: 'repo-123', name: 'frontend-app', fullName: 'org/frontend-app' },
      { id: 'repo-456', name: 'backend-api', fullName: 'org/backend-api' }
    ];

    const mockSummary = {
      velocity: { value: '18.2h', change: '-10%', trend: 'up' },
      successRate: { value: '92.5%', change: '+4%', trend: 'up' },
      participation: { value: '88.0%', change: '-2%', trend: 'down' },
      distribution: [
        { name: 'Small', value: 45, color: '#10b981' },
        { name: 'Medium', value: 35, color: '#3b82f6' },
        { name: 'Large', value: 20, color: '#f59e0b' }
      ],
      totalPrs: 100,
      mergedPrs: 92
    };

    const mockPRs = {
      items: [
        {
          id: 1,
          githubId: '101',
          title: 'feat: add analytics test suite',
          author: 'dev123',
          status: 'Merged',
          time: '2 days ago',
          additions: 150,
          deletions: 20,
          mergeTime: '4.5h'
        }
      ]
    };

    // Sequential mock implementation for the 3 calls (Repos, Summary, PR List)
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockRepos })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSummary })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPRs });

    render(<PRAnalytics />);

    // Verify Repository Dropdown
    await waitFor(() => {
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'backend-api' })).toBeInTheDocument();
    });

    // Verify KPI Cards
    expect(screen.getByText('18.2h')).toBeInTheDocument();
    expect(screen.getByText('92.5%')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();

    // Verify Small PRs count from distribution
    expect(screen.getAllByText('45')[0]).toBeInTheDocument();

    // Verify Activity Table
    expect(screen.getByText('feat: add analytics test suite')).toBeInTheDocument();
    expect(screen.getByText('dev123')).toBeInTheDocument();
  });

  it('triggers a new fetch when repository filter is changed', async () => {
    const mockRepos = [{ id: 'repo-123', name: 'frontend-app' }];
    const mockSummary = {
        velocity: { value: '1h', change: '0%', trend: 'up' },
        successRate: { value: '100%', change: '0%', trend: 'up' },
        participation: { value: '100%', change: '0%', trend: 'up' },
        distribution: [{ name: 'Small', value: 1, color: '#000' }, { name: 'Medium', value: 0, color: '#000' }, { name: 'Large', value: 0, color: '#000' }],
        totalPrs: 1, mergedPrs: 1
    };
    const mockPRs = { items: [] };

    // Initial mount fetches
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockRepos })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSummary })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPRs });
    
    render(<PRAnalytics />);

    await waitFor(() => expect(screen.getByText('frontend-app')).toBeInTheDocument());
    
    // Setup mocks for the next change interaction
    (global.fetch as any).mockClear();
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockSummary })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPRs });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'repo-123' } });

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('repositoryId=repo-123'), expect.any(Object));
    });
  });
});
