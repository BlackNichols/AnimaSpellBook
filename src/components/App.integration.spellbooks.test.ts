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
    promptCreateSection() {},
    renameSectionPrompt() {},
    reorderSectionPrompt() {},
    clearSectionAction() {},
    deleteSectionPrompt() {},
    reorderSpellPrompt() {},
    moveSpellPrompt() {},
    toggleSpellSelection() {},
    selectedCountForSection() { return 0; },
    moveSelectedPrompt() {},
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
});
