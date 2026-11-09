import Alpine from 'alpinejs';
import { SpellStore } from './stores/spellStore';
import { AppShell } from './components/AppShell';
import { SpellTable } from './components/SpellTable';
import { FilterPanel } from './components/FilterPanel';
import { SearchBox } from './components/SearchBox';
import { URLSync } from './components/URLSync';

const spellStore = Alpine.reactive(new SpellStore());

Alpine.data('app', () => ({
  ...AppShell(),
  async init() {
    await spellStore.loadSpells();
  },
}));

Alpine.data('spellTable', () => SpellTable(spellStore));
Alpine.data('filterPanel', () => FilterPanel(spellStore));
Alpine.data('searchBox', () => SearchBox(spellStore));
Alpine.data('urlSync', () => URLSync(spellStore));

declare global {
  interface Window {
    Alpine: typeof Alpine;
    spellStore: SpellStore;
  }
}

window.Alpine = Alpine;
window.spellStore = spellStore;

Alpine.start();
