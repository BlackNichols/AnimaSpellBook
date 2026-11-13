import { beforeEach, describe, expect, it } from 'vitest';
import { SpellbookStore, STORAGE_KEY } from './spellbookStore';

function resetStorage() {
  localStorage.clear();
}

describe('SpellbookStore - persistence envelope and core management', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('initializes empty state and persists versioned envelope', () => {
    const store = new SpellbookStore();
    store.load();
    expect(store.spellbooks).toEqual([]);
    expect(store.activeSpellbookId).toBeNull();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({
      version: 1,
      activeSpellbookId: null,
      nextSpellbookNumber: 1,
      spellbooks: [],
    });
  });

  it('creates a spellbook with default incremented name, new UUID, active, and persists', () => {
    const store = new SpellbookStore();
    store.load();
    const id = store.createSpellbook();
    expect(store.spellbooks).toHaveLength(1);
    const book = store.spellbooks[0]!;
    expect(book.id).toBe(id);
    expect(book.name).toBe('Spellbook 1');
    expect(book.sections).toEqual([{ id: expect.any(String), name: null, spellIds: [] }]);
    expect(store.activeSpellbookId).toBe(id);
    const id2 = store.createSpellbook();
    expect(store.spellbooks.find((b) => b.id === id2)?.name).toBe('Spellbook 2');
    expect(store.activeSpellbookId).toBe(id2);
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(parsed.nextSpellbookNumber).toBe(3);
    expect(parsed.activeSpellbookId).toBe(id2);
  });

  it('renames, activates, duplicates (new UUID/name/content copy), and deletes', () => {
    const store = new SpellbookStore();
    store.load();
    const a = store.createSpellbook();
    store.renameSpellbook(a, 'My Book');
    expect(store.getSpellbook(a)?.name).toBe('My Book');

    const b = store.createSpellbook();
    store.setActiveSpellbook(a);
    expect(store.activeSpellbookId).toBe(a);

    const bookA = store.getSpellbook(a)!;
    bookA.sections[0]!.spellIds.push('spell-1');
    store.persist();

    const dup = store.duplicateSpellbook(a);
    expect(dup).not.toBe(a);
    const dupBook = store.getSpellbook(dup)!;
    expect(dupBook.name).toBe('Spellbook 3');
    expect(dupBook.sections[0]!.spellIds).toEqual(['spell-1']);
    expect(dupBook.sections[0]!.id).not.toBe(bookA.sections[0]!.id);

    const beforeDeleteActive = store.activeSpellbookId;
    store.deleteSpellbook(b);
    expect(store.spellbooks.some((s) => s.id === b)).toBe(false);
    expect(store.activeSpellbookId).toBe(beforeDeleteActive);

    store.setActiveSpellbook(a);
    store.deleteSpellbook(a);
    expect(store.activeSpellbookId).not.toBe(a);
  });

  it('restores valid persisted state on load', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeSpellbookId: 'sb-1',
        nextSpellbookNumber: 4,
        spellbooks: [
          { id: 'sb-1', name: 'Saved', sections: [{ id: 'sec-1', name: null, spellIds: ['x'] }] },
        ],
      })
    );
    const store = new SpellbookStore();
    store.load();
    expect(store.spellbooks).toHaveLength(1);
    expect(store.spellbooks[0]!.name).toBe('Saved');
    expect(store.activeSpellbookId).toBe('sb-1');
  });

  it('handles corrupt/invalid stored data safely with no partial state and resets to empty persisted envelope', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    const store = new SpellbookStore();
    store.load();
    expect(store.spellbooks).toEqual([]);
    expect(store.activeSpellbookId).toBeNull();
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(parsed.spellbooks).toEqual([]);
    expect(parsed.version).toBe(1);
  });
});
