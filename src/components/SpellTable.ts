import type { SpellStore, Spell } from '@/stores/spellStore';

export function SpellTable(store: SpellStore) {
  return {
    get rows() {
      return store.filteredSpells;
    },
    get columns() {
      return store.columns.visible;
    },
    getField(spell: Spell, field: string) {
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
      return current ?? '';
    },
    formatValue(value: unknown) {
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return value;
    },
    toggleColumn(field: string) {
      store.toggleColumn(field);
    },
    isColumnVisible(field: string) {
      return store.columns.visible.includes(field);
    },
  };
}