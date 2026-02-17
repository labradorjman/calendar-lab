type ScrollKey = string;

type ScrollTarget = {
    getScrollElement(): HTMLElement | null;
};

export class ScrollSyncManager {
    private targets = new Map<ScrollKey, ScrollTarget>();
    private relations = new Map<ScrollKey, Set<ScrollKey>>();
    private isSyncing = false;

    get(key: ScrollKey) {
        return this.targets.get(key);
    }

    register(key: ScrollKey, target: ScrollTarget) {
        this.targets.set(key, target);
    }

    unregister(key: ScrollKey) {
        this.targets.delete(key);
        this.relations.delete(key);
    }

    /**
     * Relates a key to one or more other keys without overwriting existing relations.
     * @param key - The primary scroll key.
     * @param relatedKeys - Keys to associate with the primary key.
     */
    relate(key: ScrollKey, relatedKeys: ScrollKey[]) {
        const existing = this.relations.get(key);

        if (existing) {
            for (const relatedKey of relatedKeys) {
                existing.add(relatedKey);
            }
        } else {
            this.relations.set(key, new Set(relatedKeys));
        }
    }

    removeRelation(key: ScrollKey, relatedKey: ScrollKey) {
        this.relations.get(key)?.delete(relatedKey);
    }

    clearRelations(key: ScrollKey) {
        this.relations.delete(key);
    }

    clear() {
        this.targets.clear();
        this.relations.clear();
        this.isSyncing = false;
    }

    syncFrom(sourceKey: ScrollKey) {
        if (this.isSyncing) return;

        const source = this.targets.get(sourceKey);
        const sourceElement = source?.getScrollElement();

        if (!sourceElement) return;

        const top = sourceElement.scrollTop;

        this.isSyncing = true;
        this.relations.get(sourceKey)?.forEach(targetKey => {
            const target = this.targets.get(targetKey);
            target?.getScrollElement()?.scrollTo({ top });
        });

        requestAnimationFrame(() => {
            this.isSyncing = false;
        });
    }
}