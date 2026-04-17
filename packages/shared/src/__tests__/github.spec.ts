import {
  calculateTimeToMerge,
  formatPrStatus,
  formatTimeAgo,
  calculatePrSize,
  calculateAverageMergeTime,
  calculatePrStats,
  calculateCommitStats,
  getColorForLanguage,
  calculateChangePercent,
  calculateActivityTrend,
} from '../github';

describe('GitHub Utils', () => {
  describe('calculateTimeToMerge', () => {
    it('should return minutes for less than 1 hour', () => {
      const created = new Date('2024-01-01T10:00:00Z');
      const merged = new Date('2024-01-01T10:30:00Z');
      expect(calculateTimeToMerge(created, merged)).toBe('30m');
    });

    it('should return hours for less than 24 hours', () => {
      const created = new Date('2024-01-01T10:00:00Z');
      const merged = new Date('2024-01-01T14:30:00Z');
      expect(calculateTimeToMerge(created, merged)).toBe('4.5h');
    });

    it('should return days and hours for more than 24 hours', () => {
      const created = new Date('2024-01-01T10:00:00Z');
      const merged = new Date('2024-01-03T14:00:00Z');
      expect(calculateTimeToMerge(created, merged)).toBe('2d 4h');
    });

    it('should handle string dates', () => {
      expect(calculateTimeToMerge('2024-01-01T10:00:00Z', '2024-01-01T14:00:00Z')).toBe('4h');
    });
  });

  describe('formatPrStatus', () => {
    it('should return Merged when isMerged is true', () => {
      expect(formatPrStatus('closed', false, true)).toBe('Merged');
    });

    it('should return Draft when isDraft is true', () => {
      expect(formatPrStatus('open', true, false)).toBe('Draft');
    });

    it('should return Open for open state', () => {
      expect(formatPrStatus('open', false, false)).toBe('Open');
    });

    it('should return Closed for closed state without merge', () => {
      expect(formatPrStatus('closed', false, false)).toBe('Closed');
    });
  });

  describe('calculatePrSize', () => {
    it('should return XS for less than 10 changes', () => {
      expect(calculatePrSize(5, 3)).toBe('XS');
    });

    it('should return S for 10-100 changes', () => {
      expect(calculatePrSize(50, 30)).toBe('S');
    });

    it('should return M for 100-500 changes', () => {
      expect(calculatePrSize(200, 150)).toBe('M');
    });

    it('should return L for more than 500 changes', () => {
      expect(calculatePrSize(300, 300)).toBe('L');
    });
  });

  describe('calculateAverageMergeTime', () => {
    it('should return null when no merged PRs', () => {
      const prs = [
        { id: 1, merged_at: null, created_at: '2024-01-01T10:00:00Z' } as any,
      ];
      expect(calculateAverageMergeTime(prs)).toBeNull();
    });

    it('should calculate average merge time correctly', () => {
      const prs = [
        { id: 1, merged_at: '2024-01-01T12:00:00Z', created_at: '2024-01-01T10:00:00Z' },
        { id: 2, merged_at: '2024-01-01T14:00:00Z', created_at: '2024-01-01T10:00:00Z' },
      ] as any;
      const result = calculateAverageMergeTime(prs);
      expect(result).toBe(7200000); // 2 hours in ms
    });

    it('should handle empty array', () => {
      expect(calculateAverageMergeTime([])).toBeNull();
    });
  });

  describe('calculatePrStats', () => {
    it('should calculate all PR stats correctly', () => {
      const prs = [
        { state: 'open', merged_at: null, additions: 100, deletions: 50 } as any,
        { state: 'closed', merged_at: null, additions: 200, deletions: 100 } as any,
        { state: 'closed', merged_at: '2024-01-02T10:00:00Z', created_at: '2024-01-01T10:00:00Z', additions: 150, deletions: 75 } as any,
      ];
      const stats = calculatePrStats(prs);
      
      expect(stats.total).toBe(3);
      expect(stats.open).toBe(1);
      expect(stats.closed).toBe(1);
      expect(stats.merged).toBe(1);
      expect(stats.averageAdditions).toBe(150);
      expect(stats.averageDeletions).toBe(75);
    });

    it('should handle PRs without additions/deletions', () => {
      const prs = [
        { state: 'open', merged_at: null } as any,
      ];
      const stats = calculatePrStats(prs);
      
      expect(stats.averageAdditions).toBe(0);
      expect(stats.averageDeletions).toBe(0);
    });

    it('should handle empty array', () => {
      const stats = calculatePrStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.open).toBe(0);
      expect(stats.closed).toBe(0);
      expect(stats.merged).toBe(0);
      expect(stats.averageMergeTime).toBeNull();
    });
  });

  describe('calculateCommitStats', () => {
    it('should calculate commit stats correctly', () => {
      const commits = [
        { sha: 'abc', commit: { message: 'test', author: { date: '2024-01-01' } }, stats: { additions: 100, deletions: 50 }, files: [{ filename: 'a.ts' }] },
        { sha: 'def', commit: { message: 'test2', author: { date: '2024-01-02' } }, stats: { additions: 200, deletions: 100 }, files: [{ filename: 'b.ts' }, { filename: 'c.ts' }] },
      ] as any;
      
      const stats = calculateCommitStats(commits);
      
      expect(stats.total).toBe(2);
      expect(stats.totalAdditions).toBe(300);
      expect(stats.totalDeletions).toBe(150);
      expect(stats.totalFilesChanged).toBe(3);
      expect(stats.averageAdditions).toBe(150);
      expect(stats.averageDeletions).toBe(75);
    });

    it('should handle commits without stats', () => {
      const commits = [
        { sha: 'abc', commit: { message: 'test', author: { date: '2024-01-01' } } },
      ] as any;
      
      const stats = calculateCommitStats(commits);
      
      expect(stats.totalAdditions).toBe(0);
      expect(stats.totalDeletions).toBe(0);
      expect(stats.totalFilesChanged).toBe(0);
    });

    it('should handle empty array', () => {
      const stats = calculateCommitStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.averageAdditions).toBe(0);
      expect(stats.averageDeletions).toBe(0);
    });
  });

  describe('getColorForLanguage', () => {
    it('should return correct color for TypeScript', () => {
      expect(getColorForLanguage('TypeScript')).toBe('#3b82f6');
    });

    it('should return correct color for JavaScript', () => {
      expect(getColorForLanguage('JavaScript')).toBe('#facc15');
    });

    it('should return default color for unknown language', () => {
      expect(getColorForLanguage('UnknownLang')).toBe('#a1a1aa');
    });
  });

  describe('calculateChangePercent', () => {
    it('should calculate positive change percent', () => {
      expect(calculateChangePercent(150, 100)).toBe(50);
    });

    it('should calculate negative change percent', () => {
      expect(calculateChangePercent(75, 100)).toBe(-25);
    });

    it('should return 100 when previous is 0 and current > 0', () => {
      expect(calculateChangePercent(50, 0)).toBe(100);
    });

    it('should return 0 when both are 0', () => {
      expect(calculateChangePercent(0, 0)).toBe(0);
    });
  });

  describe('calculateActivityTrend', () => {
    it('should return up when current > previous', () => {
      expect(calculateActivityTrend(150, 100)).toBe('up');
    });

    it('should return down when current < previous', () => {
      expect(calculateActivityTrend(50, 100)).toBe('down');
    });

    it('should return neutral when current equals previous', () => {
      expect(calculateActivityTrend(100, 100)).toBe('neutral');
    });
  });
});