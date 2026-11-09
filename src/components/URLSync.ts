import type { SpellStore } from '@/stores/spellStore';

interface AlpineComponent {
  $cleanup: (() => void) | undefined;
}

export function URLSync(store: SpellStore) {
  return {
    init() {
      // Apply URL params on load
      store.fromURLParams(new URLSearchParams(window.location.search));

      // Subscribe to store changes and update URL
      const unsubscribe = store.subscribe(() => {
        const params = store.toURLParams();
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      });

      // Handle back/forward navigation
      window.addEventListener('popstate', () => {
        store.fromURLParams(new URLSearchParams(window.location.search));
      });

      // Cleanup on destroy (not needed for singleton app)
      (this as unknown as AlpineComponent).$cleanup = unsubscribe;
    },
  };
}