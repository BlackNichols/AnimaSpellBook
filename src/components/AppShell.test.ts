import { describe, it, expect } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('toggles sidebar visibility', () => {
    const shell = AppShell();
    expect(shell.sidebarOpen).toBe(true);
    shell.toggleSidebar();
    expect(shell.sidebarOpen).toBe(false);
    shell.toggleSidebar();
    expect(shell.sidebarOpen).toBe(true);
  });
});
