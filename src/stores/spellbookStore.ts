export const STORAGE_KEY = 'anima-spellbooks';

export interface Section {
  id: string;
  name: string | null;
  spellIds: string[];
}

export interface Spellbook {
  id: string;
  name: string;
  sections: Section[];
}

interface PersistedEnvelope {
  version: 1;
  activeSpellbookId: string | null;
  nextSpellbookNumber: number;
  spellbooks: Spellbook[];
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // fallback (should not be needed in modern envs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function parseSection(value: unknown): Section | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string') return null;
  if (!(v.name === null || typeof v.name === 'string')) return null;
  if (!isStringArray(v.spellIds)) return null;
  return { id: v.id, name: v.name as string | null, spellIds: [...v.spellIds] };
}

function parseSpellbook(value: unknown): Spellbook | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string') return null;
  if (typeof v.name !== 'string') return null;
  if (!Array.isArray(v.sections)) return null;
  const sections: Section[] = [];
  for (const s of v.sections) {
    const parsed = parseSection(s);
    if (!parsed) return null;
    sections.push(parsed);
  }
  return { id: v.id, name: v.name, sections };
}

function parseEnvelope(raw: string): PersistedEnvelope | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const v = data as Record<string, unknown>;
  if (v.version !== 1) return null;
  if (!(v.activeSpellbookId === null || typeof v.activeSpellbookId === 'string')) return null;
  if (typeof v.nextSpellbookNumber !== 'number' || !Number.isInteger(v.nextSpellbookNumber)) {
    return null;
  }
  if (!Array.isArray(v.spellbooks)) return null;
  const spellbooks: Spellbook[] = [];
  for (const b of v.spellbooks) {
    const parsed = parseSpellbook(b);
    if (!parsed) return null;
    spellbooks.push(parsed);
  }
  const active = v.activeSpellbookId as string | null;
  if (active !== null && !spellbooks.some((b) => b.id === active)) {
    return null;
  }
  return {
    version: 1,
    activeSpellbookId: active,
    nextSpellbookNumber: v.nextSpellbookNumber as number,
    spellbooks,
  };
}

function defaultEnvelope(): PersistedEnvelope {
  return {
    version: 1,
    activeSpellbookId: null,
    nextSpellbookNumber: 1,
    spellbooks: [],
  };
}

export class SpellbookStore {
  spellbooks: Spellbook[] = [];
  activeSpellbookId: string | null = null;
  nextSpellbookNumber = 1;

  private subscribers: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      this.applyEnvelope(defaultEnvelope());
      this.persist();
      return;
    }
    const parsed = parseEnvelope(raw);
    if (!parsed) {
      this.applyEnvelope(defaultEnvelope());
      this.persist();
      return;
    }
    this.applyEnvelope(parsed);
    this.notify();
  }

  private applyEnvelope(env: PersistedEnvelope) {
    this.spellbooks = env.spellbooks;
    this.activeSpellbookId = env.activeSpellbookId;
    this.nextSpellbookNumber = env.nextSpellbookNumber;
  }

  persist() {
    const env: PersistedEnvelope = {
      version: 1,
      activeSpellbookId: this.activeSpellbookId,
      nextSpellbookNumber: this.nextSpellbookNumber,
      spellbooks: this.spellbooks,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
    } catch {
      // Safe failure: keep in-memory state consistent, do not throw.
    }
  }

  getSpellbook(id: string): Spellbook | undefined {
    return this.spellbooks.find((b) => b.id === id);
  }

  createSpellbook(): string {
    const id = uuid();
    const book: Spellbook = {
      id,
      name: `Spellbook ${this.nextSpellbookNumber}`,
      sections: [{ id: uuid(), name: null, spellIds: [] }],
    };
    this.spellbooks.push(book);
    this.nextSpellbookNumber += 1;
    this.activeSpellbookId = id;
    this.persist();
    this.notify();
    return id;
  }

  setActiveSpellbook(id: string): boolean {
    if (!this.getSpellbook(id)) return false;
    this.activeSpellbookId = id;
    this.persist();
    this.notify();
    return true;
  }

  renameSpellbook(id: string, name: string): boolean {
    const book = this.getSpellbook(id);
    if (!book) return false;
    book.name = name;
    this.persist();
    this.notify();
    return true;
  }

  duplicateSpellbook(id: string): string {
    const source = this.getSpellbook(id);
    if (!source) return '';
    const newId = uuid();
    const copy: Spellbook = {
      id: newId,
      name: `Spellbook ${this.nextSpellbookNumber}`,
      sections: source.sections.map((s) => ({
        id: uuid(),
        name: s.name,
        spellIds: [...s.spellIds],
      })),
    };
    this.spellbooks.push(copy);
    this.nextSpellbookNumber += 1;
    this.persist();
    this.notify();
    return newId;
  }

  deleteSpellbook(id: string): { deleted: boolean; deletedActive: boolean } {
    const idx = this.spellbooks.findIndex((b) => b.id === id);
    if (idx === -1) return { deleted: false, deletedActive: false };
    const wasActive = this.activeSpellbookId === id;
    this.spellbooks.splice(idx, 1);
    if (wasActive) {
      this.activeSpellbookId = null;
    }
    this.persist();
    this.notify();
    return { deleted: true, deletedActive: wasActive };
  }
}
