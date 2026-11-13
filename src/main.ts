import Alpine from 'alpinejs';
import { SpellStore } from './stores/spellStore';
import { SpellbookStore } from './stores/spellbookStore';
import { AppShell } from './components/AppShell';
import { SpellTable } from './components/SpellTable';
import { FilterPanel } from './components/FilterPanel';
import { SearchBox } from './components/SearchBox';
import { createRouter } from './router/router';

const spellStore = Alpine.reactive(new SpellStore());
const spellbookStore = Alpine.reactive(new SpellbookStore());
const router = createRouter(spellStore, {
  base: import.meta.env.BASE_URL,
  spellbookStore,
});

const routeState = Alpine.reactive({
  view: router.route.view as 'spelllist' | 'spellbooks' | 'spellbook',
  path: router.route.path,
  search: router.route.search,
  spellbookId: router.route.spellbookId as string | null,
});

router.onRouteChange(() => {
  routeState.view = router.route.view;
  routeState.path = router.route.path;
  routeState.search = router.route.search;
  routeState.spellbookId = router.route.spellbookId;
});

const appShell = {
  ...AppShell(),
  editingName: '',
  get route() {
    return routeState;
  },
  get isSpellListView() {
    return routeState.view === 'spelllist';
  },
  get isSpellbooksView() {
    return routeState.view === 'spellbooks';
  },
  get isSpellbookView() {
    return routeState.view === 'spellbook';
  },
  get spellbooks() {
    return spellbookStore.spellbooks;
  },
  get activeSpellbook() {
    const id = routeState.spellbookId ?? spellbookStore.activeSpellbookId;
    return id ? spellbookStore.getSpellbook(id) : undefined;
  },
  clearFilters() {
    router.clearFilters();
  },
  goToSpellbooks() {
    router.navigate('/spellbooks');
  },
  goToSpellList() {
    router.navigate('/spelllist');
  },
  openSpellbook(id: string) {
    router.navigate(`/spellbooks/${id}`);
  },
  createSpellbook() {
    const id = spellbookStore.createSpellbook();
    router.navigate(`/spellbooks/${id}`);
  },
  saveSpellbookName() {
    const id = routeState.spellbookId ?? spellbookStore.activeSpellbookId;
    if (!id) return;
    spellbookStore.renameSpellbook(id, this.editingName);
  },
  duplicateSpellbook(id: string) {
    const dup = spellbookStore.duplicateSpellbook(id);
    if (dup) router.navigate(`/spellbooks/${dup}`);
  },
  duplicateActiveSpellbook() {
    const id = routeState.spellbookId ?? spellbookStore.activeSpellbookId;
    if (!id) return;
    this.duplicateSpellbook(id);
  },
  deleteSpellbook(id: string) {
    const res = spellbookStore.deleteSpellbook(id);
    if (res.deletedActive) router.handleActiveDeleted();
  },
  deleteActiveSpellbook() {
    const id = routeState.spellbookId ?? spellbookStore.activeSpellbookId;
    if (!id) return;
    this.deleteSpellbook(id);
  },
  async init() {
    spellbookStore.load();
    await spellStore.loadSpells();
    router.start();
    this.$watch?.('route.spellbookId', () => {
      const book = this.activeSpellbook as any;
      this.editingName = book?.name ?? '';
    });
    const book = this.activeSpellbook as any;
    this.editingName = book?.name ?? '';
  },
};

Alpine.data('app', () => appShell);

Alpine.data('spellTable', () => SpellTable(spellStore));
Alpine.data('filterPanel', () => FilterPanel(spellStore));
Alpine.data('searchBox', () => SearchBox(spellStore));

declare global {
  interface Window {
    Alpine: typeof Alpine;
    spellStore: SpellStore;
    appRouter: typeof router;
  }
}

window.Alpine = Alpine;
window.spellStore = spellStore;
window.appRouter = router;

Alpine.start();
