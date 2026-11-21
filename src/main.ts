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
  promptCreateSection() {
    const book = this.activeSpellbook;
    if (!book) return;
    const name = window.prompt('New section name:', 'Section');
    if (name === null) return;
    const placementAns = window.prompt('Place section: "first", "last", or position number:', 'last');
    if (placementAns === null) return;
    const t = placementAns.trim().toLowerCase();
    let placement: 'first' | 'last' | { index: number } = 'last';
    if (t === 'first') placement = 'first';
    else if (t === 'last' || t === '') placement = 'last';
    else {
      const n = parseInt(t, 10);
      placement = Number.isNaN(n) ? 'last' : { index: n };
    }
    spellbookStore.createNamedSection(book.id, name, { placement });
  },
  spellName(spellId: string) {
    const spell = spellStore.spells.find((s) => s.id === spellId);
    return spell?.name ?? spellId;
  },
  ensureActiveSpellbookForAdd(): string {
    let id = spellbookStore.activeSpellbookId;
    if (!id || !spellbookStore.getSpellbook(id)) {
      id = spellbookStore.createSpellbook();
    }
    return id;
  },
  addSpellsFromList(spellIds: string[], options?: { navigateToBook?: boolean }) {
    if (spellIds.length === 0) return;
    const bookId = this.ensureActiveSpellbookForAdd();
    const book = spellbookStore.getSpellbook(bookId);
    if (!book) return;
    const named = book.sections.filter((s) => s.name !== null);
    let targetId: string | null = null;
    if (named.length === 0) {
      targetId = book.sections[0]?.id ?? null;
    } else {
      const optionsList = book.sections
        .map((s, i) => `${i + 1}: ${s.name ?? 'Default'}`)
        .join('\n');
      const ans = window.prompt(
        `Add to which section?\n${optionsList}\nEnter number, or "n" to create a new named section:`,
        '1'
      );
      if (ans === null) return;
      if (ans.toLowerCase() === 'n') {
        targetId = this.promptCreateSectionForBook(bookId);
      } else {
        const idx = parseInt(ans, 10);
        if (Number.isNaN(idx)) targetId = book.sections[0]?.id ?? null;
        else {
          const clamped = Math.max(1, Math.min(book.sections.length, idx));
          targetId = book.sections[clamped - 1]?.id ?? null;
        }
      }
    }
    if (targetId) {
      spellbookStore.addSpellsToSection(bookId, targetId, spellIds);
      if (options?.navigateToBook) router.navigate(`/spellbooks/${bookId}`);
    }
  },
  promptCreateSectionForBook(bookId: string): string | null {
    const name = window.prompt('New section name:', 'Section');
    if (name === null) return null;
    const placementAns = window.prompt('Place section: "first", "last", or position number:', 'last');
    if (placementAns === null) return null;
    const t = placementAns.trim().toLowerCase();
    let placement: 'first' | 'last' | { index: number } = 'last';
    if (t === 'first') placement = 'first';
    else if (t === 'last' || t === '') placement = 'last';
    else {
      const n = parseInt(t, 10);
      placement = Number.isNaN(n) ? 'last' : { index: n };
    }
    return spellbookStore.createNamedSection(bookId, name, { placement });
  },
  renameSectionPrompt(section: { id: string; name: string | null }) {
    const book = this.activeSpellbook;
    if (!book) return;
    const name = window.prompt('Rename section:', section.name ?? '');
    if (name === null) return;
    spellbookStore.renameSection(book.id, section.id, name);
  },
  clearSectionAction(section: { id: string }) {
    const book = this.activeSpellbook;
    if (!book) return;
    spellbookStore.clearSection(book.id, section.id);
  },
  reorderSectionPrompt(section: { id: string }) {
    const book = this.activeSpellbook;
    if (!book) return;
    const ans = window.prompt('New 1-based section position:', '1');
    if (ans === null) return;
    const n = parseInt(ans, 10);
    if (Number.isNaN(n)) return;
    spellbookStore.reorderSection(book.id, section.id, n);
  },
  deleteSectionPrompt(section: { id: string; name: string | null }) {
    const book = this.activeSpellbook;
    if (!book) return;
    const named = book.sections.filter((s) => s.name !== null);
    const isLastNamed = section.name !== null && named.length === 1;
    if (isLastNamed) {
      // Last named section: becomes default unnamed with its spells moved in (no prompt).
      spellbookStore.deleteSection(book.id, section.id, { mode: 'deleteSpells' });
      return;
    }
    if (book.sections.length <= 1) {
      spellbookStore.deleteSection(book.id, section.id, { mode: 'deleteSpells' });
      return;
    }
    const move = window.confirm('Move spells to another section? (OK = move, Cancel = delete spells with section)');
    if (move) {
      const others = book.sections.filter((s) => s.id !== section.id);
      const options = others.map((s, i) => `${i + 1}: ${s.name ?? 'Default'}`).join('\n');
      const ans = window.prompt(`Move spells to which section?\n${options}`, '1');
      if (ans === null) return;
      const idx = parseInt(ans, 10);
      const clamped = Math.max(1, Math.min(others.length, Number.isNaN(idx) ? 1 : idx));
      const target = others[clamped - 1]!;
      spellbookStore.deleteSection(book.id, section.id, { mode: 'move', targetSectionId: target.id });
    } else {
      spellbookStore.deleteSection(book.id, section.id, { mode: 'deleteSpells' });
    }
  },
  reorderSpellPrompt(section: { id: string }, spellId: string) {
    const book = this.activeSpellbook;
    if (!book) return;
    const ans = window.prompt('New 1-based spell position:', '1');
    if (ans === null) return;
    const n = parseInt(ans, 10);
    if (Number.isNaN(n)) return;
    spellbookStore.reorderSpellInSection(book.id, section.id, spellId, n);
  },
  moveSpellPrompt(section: { id: string }, spellIds: string[]) {
    const book = this.activeSpellbook;
    if (!book) return;
    const options = book.sections
      .map((s, i) => `${i + 1}: ${s.name ?? 'Default'}`)
      .join('\n');
    const ans = window.prompt(`Move to which section?\n${options}\nEnter number, or "n" for new section:`, '1');
    if (ans === null) return;
    let targetId: string | null = null;
    if (ans.toLowerCase() === 'n') {
      targetId = this.promptCreateSectionForBook(book.id);
    } else {
      const idx = parseInt(ans, 10);
      if (Number.isNaN(idx)) return;
      const clamped = Math.max(1, Math.min(book.sections.length, idx));
      targetId = book.sections[clamped - 1]?.id ?? null;
    }
    if (!targetId || targetId === section.id) return;
    spellbookStore.moveSpellsToSection(book.id, section.id, spellIds, targetId);
    this.selectedSpellIdsBySection = {
      ...this.selectedSpellIdsBySection,
      [section.id]: [],
    };
  },
  selectedSpellIdsBySection: {} as Record<string, string[]>,
  toggleSpellSelection(sectionId: string, spellId: string, checked: boolean) {
    const cur = this.selectedSpellIdsBySection[sectionId] ?? [];
    if (checked) {
      if (!cur.includes(spellId)) cur.push(spellId);
    } else {
      const i = cur.indexOf(spellId);
      if (i >= 0) cur.splice(i, 1);
    }
    this.selectedSpellIdsBySection = {
      ...this.selectedSpellIdsBySection,
      [sectionId]: [...cur],
    };
  },
  selectedCountForSection(sectionId: string) {
    return (this.selectedSpellIdsBySection[sectionId] ?? []).length;
  },
  moveSelectedPrompt(section: { id: string }) {
    const selected = this.selectedSpellIdsBySection[section.id] ?? [];
    if (selected.length === 0) return;
    this.moveSpellPrompt(section, [...selected]);
  },
  async init() {
    spellbookStore.load();
    await spellStore.loadSpells();
    router.start();
    (this as { $watch?: (expr: string, cb: () => void) => void }).$watch?.('route.spellbookId', () => {
      const book = this.activeSpellbook;
      this.editingName = book?.name ?? '';
    });
    const book = this.activeSpellbook;
    this.editingName = book?.name ?? '';
  },
};

Alpine.data('app', () => appShell);

Alpine.data('spellTable', () => SpellTable(spellStore));
Alpine.data('filterPanel', () => FilterPanel(spellStore));
Alpine.data('searchBox', () => SearchBox(spellStore));

document.addEventListener('add-spell-to-spellbook', ((e: CustomEvent<{ spellId: string }>) => {
  const spellId = e.detail?.spellId;
  if (spellId) appShell.addSpellsFromList([spellId]);
}) as EventListener);

document.addEventListener('add-all-filtered-spells', () => {
  const ids = spellStore.filteredSpells.map((s) => s.id);
  if (ids.length === 0) return;
  const navigateToBook = window.confirm('Spells added. Open spellbook? (OK = open, Cancel = stay on spell list)');
  appShell.addSpellsFromList(ids, { navigateToBook });
});

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
