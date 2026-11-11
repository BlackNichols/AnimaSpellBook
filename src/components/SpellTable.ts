import type { SpellStore, Spell } from '../stores/spellStore';

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  path: 'Path',
  level: 'Level',
  effect: 'Description',
};

function displayPath(spell: Spell): string {
  if (spell.category === 'free_access') return 'Free Access';
  return spell.path ?? '';
}

function displayLevel(spell: Spell): string {
  if (spell.category === 'free_access') {
    const b = spell.level_bracket;
    return b ? `${b[0]}-${b[1]}` : '';
  }
  return spell.level === null ? '' : String(spell.level);
}

export function SpellTable(store: SpellStore) {
  return {
    expandedId: null as string | null,
    get rows() {
      return store.filteredSpells;
    },
    get columns() {
      return store.columns.visible;
    },
    get total() {
      return store.spells.length;
    },
    isExpanded(spell: Spell) {
      return this.expandedId === spell.id;
    },
    toggleExpanded(spell: Spell) {
      this.expandedId = this.expandedId === spell.id ? null : spell.id;
    },
    columnLabel(field: string) {
      return COLUMN_LABELS[field] ?? field;
    },
    getField(spell: Spell, field: string) {
      if (field === 'path') return displayPath(spell);
      if (field === 'level') return displayLevel(spell);
      return this.getNestedValue(spell as object, field);
    },
    getNestedValue(obj: object, path: string) {
      if (!obj) return '';
      const parts = path.split('_');
      let current: unknown = obj;
      for (const part of parts) {
        if (current === null || current === undefined) return '';
        current = (current as Record<string, unknown>)[part];
      }
      if (current === null || current === undefined) return '';
      return current;
    },
    formatValue(value: unknown) {
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return String(value);
    },
    toggleColumn(field: string) {
      store.toggleColumn(field);
    },
    isColumnVisible(field: string) {
      return store.columns.visible.includes(field);
    },
  };
}
