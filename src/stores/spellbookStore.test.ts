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

  it('setActiveSpellbook is idempotent: no persist/notify when activating already-active id', () => {
    const store = new SpellbookStore();
    store.load();
    const a = store.createSpellbook();
    const rawAfterCreate = localStorage.getItem(STORAGE_KEY);
    let notifications = 0;
    store.subscribe(() => notifications++);
    const result = store.setActiveSpellbook(a);
    expect(result).toBe(true);
    expect(store.activeSpellbookId).toBe(a);
    expect(notifications).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawAfterCreate);
  });

describe('SpellbookStore - add spells to section (Chunk 3)', () => {
  beforeEach(() => {
    resetStorage();
  });

  it('appends given spell IDs to end of target section in order and skips duplicates already in that section', () => {
    const store = new SpellbookStore();
    store.load();
    const bookId = store.createSpellbook();
    const book = store.getSpellbook(bookId)!;
    const sectionId = book.sections[0]!.id;

    store.addSpellsToSection(bookId, sectionId, ['s1', 's2', 's1', 's3', 's2']);
    expect(store.getSpellbook(bookId)!.sections[0]!.spellIds).toEqual(['s1', 's2', 's3']);

    store.addSpellsToSection(bookId, sectionId, ['s2', 's4', 's1']);
    expect(store.getSpellbook(bookId)!.sections[0]!.spellIds).toEqual(['s1', 's2', 's3', 's4']);
  });

  it('reorders sections by 1-based position edit (clamped)', () => {
    const store = new SpellbookStore();
    store.load();
    const bookId = store.createSpellbook();
    store.createNamedSection(bookId, 'A', { placement: 'last' }); // converts default
    store.createNamedSection(bookId, 'B', { placement: 'last' });
    store.createNamedSection(bookId, 'C', { placement: 'last' });
    const ids = store.getSpellbook(bookId)!.sections.map((s) => s.id);

    store.reorderSection(bookId, ids[2]!, 1);
    expect(store.getSpellbook(bookId)!.sections.map((s) => s.name)).toEqual(['C', 'A', 'B']);

    store.reorderSection(bookId, ids[0]!, 99);
    expect(store.getSpellbook(bookId)!.sections.map((s) => s.name)).toEqual(['C', 'B', 'A']);
  });

  it('converts default on first named section, supports placement, rename, clear, and delete behaviors', () => {
    const store = new SpellbookStore();
    store.load();
    const bookId = store.createSpellbook();
    const defaultId = store.getSpellbook(bookId)!.sections[0]!.id;
    store.addSpellsToSection(bookId, defaultId, ['a', 'b']);

    store.createNamedSection(bookId, 'Alpha', { placement: 'last' });
    let book = store.getSpellbook(bookId)!;
    expect(book.sections).toHaveLength(1);
    expect(book.sections[0]).toMatchObject({ id: defaultId, name: 'Alpha', spellIds: ['a', 'b'] });

    const idB = store.createNamedSection(bookId, 'Beta', { placement: 'last' })!;
    const idC = store.createNamedSection(bookId, 'Gamma', { placement: 'first' })!;
    expect(store.getSpellbook(bookId)!.sections.map((s) => s.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
    store.createNamedSection(bookId, 'Delta', { placement: { index: 2 } });
    expect(store.getSpellbook(bookId)!.sections.map((s) => s.name)).toEqual(['Gamma', 'Delta', 'Alpha', 'Beta']);

    store.renameSection(bookId, idB, 'Beta2');
    store.addSpellsToSection(bookId, idB, ['x', 'y']);
    store.clearSection(bookId, idB);
    book = store.getSpellbook(bookId)!;
    expect(book.sections.find((s) => s.id === idB)!.name).toBe('Beta2');
    expect(book.sections.find((s) => s.id === idB)!.spellIds).toEqual([]);

    // delete non-last named: move spells to chosen existing section (remaining named sections stay named)
    store.addSpellsToSection(bookId, idC, ['c1']);
    store.deleteSection(bookId, idC, { mode: 'move', targetSectionId: defaultId });
    book = store.getSpellbook(bookId)!;
    expect(book.sections.some((s) => s.id === idC)).toBe(false);
    expect(book.sections.find((s) => s.id === defaultId)!.name).toBe('Alpha');
    expect(book.sections.find((s) => s.id === defaultId)!.spellIds).toEqual(['a', 'b', 'c1']);
    expect(book.sections.every((s) => s.name !== null)).toBe(true);

    // delete non-last named: delete spells with it (remaining named sections stay named)
    const idZ = store.createNamedSection(bookId, 'Zeta', { placement: 'last' })!;
    store.addSpellsToSection(bookId, idZ, ['z1']);
    store.deleteSection(bookId, idZ, { mode: 'deleteSpells' });
    book = store.getSpellbook(bookId)!;
    expect(book.sections.some((s) => s.id === idZ)).toBe(false);
    expect(book.sections.map((s) => s.name)).toEqual(['Delta', 'Alpha', 'Beta2']);

    // delete non-last named among multiple named (Beta2 empty): Alpha,Delta remain named
    store.addSpellsToSection(bookId, defaultId, ['keep']);
    const deltaId = store.getSpellbook(bookId)!.sections.find((s) => s.name === 'Delta')!.id;
    const betaId = store.getSpellbook(bookId)!.sections.find((s) => s.name === 'Beta2')!.id;
    store.deleteSection(bookId, betaId, { mode: 'deleteSpells' }); // non-last (3 named) -> Delta,Alpha remain named
    book = store.getSpellbook(bookId)!;
    expect(book.sections.map((s) => s.name)).toEqual(['Delta', 'Alpha']);

    store.addSpellsToSection(bookId, deltaId, ['d1']);
    store.deleteSection(bookId, defaultId, { mode: 'deleteSpells' }); // delete Alpha (non-last now) -> Delta remains as only named
    book = store.getSpellbook(bookId)!;
    expect(book.sections).toHaveLength(1);
    expect(book.sections[0]!.name).toBe('Delta');
    expect(book.sections[0]!.spellIds).toEqual(['d1']);

    store.deleteSection(bookId, deltaId, { mode: 'deleteSpells' }); // deleting last named -> becomes default unnamed, its spells moved into it
    book = store.getSpellbook(bookId)!;
    expect(book.sections).toHaveLength(1);
    expect(book.sections[0]!.name).toBeNull();
    expect(book.sections[0]!.spellIds).toEqual(['d1']);
  });

  it('reorders spells within a section and moves spells to another section appended to end (skipping target duplicates)', () => {
    const store = new SpellbookStore();
    store.load();
    const bookId = store.createSpellbook();
    const s1 = store.getSpellbook(bookId)!.sections[0]!.id;
    store.createNamedSection(bookId, 'Alpha', { placement: 'last' });
    const s2 = store.createNamedSection(bookId, 'Beta', { placement: 'last' })!;
    store.addSpellsToSection(bookId, s1, ['a', 'b', 'c', 'd']);
    store.addSpellsToSection(bookId, s2, ['x']);

    store.reorderSpellInSection(bookId, s1, 'c', 1);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s1)!.spellIds).toEqual(['c', 'a', 'b', 'd']);
    store.reorderSpellInSection(bookId, s1, 'c', 99);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s1)!.spellIds).toEqual(['a', 'b', 'd', 'c']);

    store.moveSpellsToSection(bookId, s1, ['b', 'd'], s2);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s1)!.spellIds).toEqual(['a', 'c']);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s2)!.spellIds).toEqual(['x', 'b', 'd']);

    store.addSpellsToSection(bookId, s1, ['x']);
    store.moveSpellsToSection(bookId, s1, ['x', 'a'], s2);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s1)!.spellIds).toEqual(['c']);
    expect(store.getSpellbook(bookId)!.sections.find((s) => s.id === s2)!.spellIds).toEqual(['x', 'b', 'd', 'a']);
  });
});
