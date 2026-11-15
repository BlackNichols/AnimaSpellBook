import { describe, it, expect } from 'vitest';
import Alpine from 'alpinejs';
import fs from 'fs';
import path from 'path';
import { SpellStore } from '../stores/spellStore';
import { SpellbookStore } from '../stores/spellbookStore';
import { createRouter } from '../router/router';

function getSpellbooksMarkup(): string {
  const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const m = html.match(/<section class="spellbooks-view"[\s\S]*?<\/section>/i);
  return m?.[0] ?? '';
}

async function mountSpellbookApp(url = '/spellbooks') {
  localStorage.clear();
  window.history.replaceState({}, '', url);
  document.body.innerHTML = `<div id="app" x-data="app()">${getSpellbooksMarkup()}</div>`;

  const spellStore = Alpine.reactive(new SpellStore());
  await spellStore.loadSpells();
  const spellbookStore = Alpine.reactive(new SpellbookStore());
  const router = createRouter(spellStore, { base: '/', spellbookStore });
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

  const app = {
    editingName: '',
    selectedSpellIdsBySection: {} as Record<string, string[]>,
    get route() { return routeState; },
    get isSpellListView() { return routeState.view === 'spelllist'; },
    get isSpellbooksView() { return routeState.view === 'spellbooks'; },
    get isSpellbookView() { return routeState.view === 'spellbook'; },
    get spellbooks() { return spellbookStore.spellbooks; },
    get activeSpellbook() {
      const id = routeState.spellbookId ?? spellbookStore.activeSpellbookId;
      return id ? spellbookStore.getSpellbook(id) : undefined;
    },
    clearFilters() { router.clearFilters(); },
    goToSpellbooks() { router.navigate('/spellbooks'); },
    goToSpellList() { router.navigate('/spelllist'); },
    openSpellbook(id: string) { router.navigate(`/spellbooks/${id}`); },
    createSpellbook() { router.navigate(`/spellbooks/${spellbookStore.createSpellbook()}`); },
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
    spellName(spellId: string) { return spellId; },
    promptCreateSectionForBook(bookId: string) {
      const name = window.prompt('Section name:', 'Section');
      if (name === null) return null;
      const placementAns = window.prompt('Place where? (first, last, or 1-based index)', 'last') ?? 'last';
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
    promptCreateSection() {
      const book = this.activeSpellbook;
      if (!book) return;
      this.promptCreateSectionForBook(book.id);
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
      router.start();
      const book = this.activeSpellbook as { name?: string } | undefined;
      this.editingName = book?.name ?? '';
    },
  };

  (window as unknown as { Alpine: typeof Alpine }).Alpine = Alpine;
  Alpine.data('app', () => app);
  Alpine.initTree(document.getElementById('app')!);
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  router.onRouteChange(() => {
    const book = (app as unknown as { activeSpellbook?: { name?: string } }).activeSpellbook;
    (app as unknown as { editingName: string }).editingName = book?.name ?? '';
  });
  return { app, router, spellbookStore, routeState };
}

function text(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('Spellbook UI bindings integration (F6)', () => {
  it('renders management empty state and supports create/rename/duplicate/delete/select flows via real UI bindings', async () => {
    const { spellbookStore } = await mountSpellbookApp('/spellbooks');
    await new Promise((r) => setTimeout(r, 0));
    expect(document.querySelector('[data-testid="spellbooks-empty"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="spellbook-create"]')).not.toBeNull();

    (document.querySelector('[data-testid="spellbook-create"]') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.pathname).toMatch(/^\/spellbooks\/[^/]+$/);
    expect(document.querySelector('[data-testid="spellbook-editor"]')).not.toBeNull();

    const nameInput = document.querySelector('[data-testid="spellbook-name-input"]') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe('Spellbook 1');

    nameInput.value = 'Alpha';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    (Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save name')) as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    const id = spellbookStore.spellbooks[0]!.id;
    expect(spellbookStore.getSpellbook(id)?.name).toBe('Alpha');

    (Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Back to spellbooks')) as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.pathname).toBe('/spellbooks');
    expect(text(document.querySelector('.spellbook-list'))).toContain('Alpha');

    (Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Duplicate Alpha') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(spellbookStore.spellbooks.length).toBe(2);
    expect(window.location.pathname).toMatch(/^\/spellbooks\/[^/]+$/);

    (Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Back to spellbooks')) as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    (Array.from(document.querySelectorAll('.spellbook-list a')).find(a => a.textContent?.trim() === 'Alpha') as HTMLAnchorElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect((document.querySelector('[data-testid="spellbook-name-input"]') as HTMLInputElement).value).toBe('Alpha');

    (Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Delete spellbook')) as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.pathname).toBe('/spellbooks');
  });

  it('wires section/spell editor actions via real bindings (create/rename/clear, reorder, move, delete prompt paths)', async () => {
    const { spellbookStore } = await mountSpellbookApp('/spellbooks');
    const tick = async (ms = 20) => {
      const w = window as unknown as { Alpine?: { flush?: () => void; nextTick?: (cb?: () => void) => Promise<void> } };
      w.Alpine?.flush?.();
      if (w.Alpine?.nextTick) await w.Alpine.nextTick();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, ms));
      w.Alpine?.flush?.();
    };
    const waitFor = async (fn: () => boolean, timeoutMs = 3000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (fn()) return;
        await tick(30);
      }
      throw new Error('waitFor timeout');
    };
    const findBtn = (label: string) =>
      Array.from(document.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label
      ) as HTMLButtonElement | undefined;
    const findBtns = (label: string) =>
      Array.from(document.querySelectorAll('button')).filter(
        (b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label
      ) as HTMLButtonElement[];
    const mustBtn = (label: string) => {
      const b = findBtn(label);
      if (!b) throw new Error(`Missing button "${label}"`);
      return b;
    };

    await tick(30);
    (document.querySelector('[data-testid="spellbook-create"]') as HTMLButtonElement).click();
    await tick(30);
    const book = spellbookStore.spellbooks[0]!;
    spellbookStore.addSpellsToSection(book.id, book.sections[0]!.id, ['spell-a', 'spell-b']);
    await tick(40);

    const origPrompt = window.prompt;
    const origConfirm = window.confirm;
    try {
      // create first named section (converts default in place)
      const prompts = ['Combat', 'last'];
      window.prompt = (() => prompts.shift() ?? '') as typeof window.prompt;
      (document.querySelector('[data-testid="add-section"]') as HTMLButtonElement).click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)?.sections[0]!.name === 'Combat');
      await tick(40);

      // rename section via bound prompt
      await waitFor(() => !!findBtn('Rename section'));
      window.prompt = (() => 'Battle') as typeof window.prompt;
      mustBtn('Rename section').click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)?.sections[0]!.name === 'Battle');

      // add another named section and reorder by 1-based position
      const prompts2 = ['Utility', 'last'];
      window.prompt = (() => prompts2.shift() ?? '') as typeof window.prompt;
      (document.querySelector('[data-testid="add-section"]') as HTMLButtonElement).click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)!.sections.length === 2);
      await waitFor(() => findBtns('Section position').length >= 2);
      window.prompt = (() => '1') as typeof window.prompt;
      findBtns('Section position')[1]!.click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)?.sections.map((s) => s.name).join(',') === 'Utility,Battle');

      // reorder spell inside Battle by 1-based position (Battle is now second, has 2 spells)
      await waitFor(() => findBtns('Spell position').length >= 2);
      window.prompt = (() => '1') as typeof window.prompt;
      const battleSpellPosBtns = findBtns('Spell position').slice(-2);
      battleSpellPosBtns[1]!.click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)!.sections.find((s) => s.name === 'Battle')!.spellIds.join(',') === 'spell-b,spell-a');

      // move single spell from Battle to Utility (first section) via prompt
      await waitFor(() => findBtns('Move spell').length >= 1);
      window.prompt = (() => '1') as typeof window.prompt;
      const moveBtns = findBtns('Move spell');
      moveBtns[moveBtns.length - 1]!.click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)!.sections.find((s) => s.name === 'Utility')!.spellIds.includes('spell-a'));

      // delete non-last named section choosing to delete its spells (Cancel path)
      await waitFor(() => findBtns('Delete section').length >= 2);
      window.confirm = (() => false) as typeof window.confirm;
      findBtns('Delete section')[0]!.click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)!.sections.length === 1);
      const afterDel = spellbookStore.getSpellbook(book.id)!;
      expect(afterDel.sections[0]!.name).toBe('Battle');

      // clear remaining section via bound action
      await waitFor(() => !!findBtn('Clear section'));
      mustBtn('Clear section').click();
      await waitFor(() => spellbookStore.getSpellbook(book.id)!.sections[0]!.spellIds.length === 0);
      await tick(30);
      expect(text(document.body)).toContain('No spells in this section.');
    } finally {
      window.prompt = origPrompt;
      window.confirm = origConfirm;
    }
  });
});
