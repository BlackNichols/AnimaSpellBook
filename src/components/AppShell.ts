export function AppShell() {
  return {
    sidebarOpen: true,
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
  };
}
