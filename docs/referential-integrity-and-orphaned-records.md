# Dexie Cloud Referential Integrity & Orphaned Records

## TL;DR

IndexedDB and Dexie Cloud are document/object stores without foreign key constraints or cascading deletes (`ON DELETE CASCADE`). Relationships across tables (e.g. `wayfinderOrder.todoId` referencing `todos.id`) are not enforced by the storage engine or sync protocol. Application code must treat cross-table references as eventually consistent, query defensively against missing entries, and maintain self-healing reconciliation.

---

## The Core Constraint

In relational SQL databases, foreign keys ensure that deleting a parent record either prevents the deletion (`RESTRICT`) or automatically cleans up referencing rows (`CASCADE`).

In IndexedDB and Dexie Cloud:
1. **No Relational Constraints**: IndexedDB stores independent object stores. Dexie has no built-in mechanism to cascade deletes across tables.
2. **Table-by-Table Sync**: Dexie Cloud synchronizes changes table-by-table rather than as distributed atomic multi-table transactions. Even if a local device wraps multiple deletions in `db.transaction('rw', db.todos, db.wayfinderOrder, ...)`, remote clients receive and apply mutation batches table-by-table over WebSocket/HTTP.

---

## How Orphaned Records Occur

Orphaned records (such as an entry in `wayfinderOrder` pointing to a `todoId` that does not exist in `todos`) occur through four primary paths:

### 1. Asynchronous & Interrupted Sync
When Device A deletes a todo and its wayfinder order entry, Device B syncs down those changes.
* If mutations for `todos` apply before `wayfinderOrder`, there is an intermediate window where `wayfinderOrder` points to a deleted todo.
* If a network disconnect or sync error occurs mid-stream (such as a transient `AbortError: The connection was closed`), one table's deletion may be persisted locally while the other table's deletion remains pending until the next successful sync cycle.

### 2. Historical Sync Conflicts & Rejections
If an operation on an ordering table encounters a conflict or constraint error on the server (such as the ordering collision issue documented in `docs/order-consistency-breaking-sync.md`), the server may accept the `todos.delete` mutation while rejecting or delaying the `wayfinderOrder` mutation. This leaves the ordering entry permanently stored in Dexie Cloud until explicitly deleted.

### 3. Uncoordinated Local Deletions
Directly deleting from a primary table without also deleting from referencing auxiliary tables leaves orphaned entries. For example:
```typescript
// Deletes todos matching a condition, but leaves stale references in wayfinderOrder:
await db.todos.where('title').equals('').delete()
```

### 4. Legacy Migrations
When migrating legacy list tables (such as migrating `#important` or `asteroidFieldOrder` into `wayfinderOrder`), bulk-copying ID arrays without checking if the referenced todos actually exist in `db.todos` inserts existing orphans into the new table.

---

## The Crash Pattern

Dexie's `table.bulkGet(keys)` returns an array of the same length and order as `keys`, placing `undefined` in the slots of any keys that were not found:

```typescript
// If wayfinderTodoIds contains an orphaned ID:
const wayfinderTodos = await db.todos.bulkGet(wayfinderTodoIds)
// wayfinderTodos = [Todo, undefined, Todo]

// Unsafe mapping crashes with TypeError: Cannot read properties of undefined (reading 'id'):
const list = wayfinderTodos.map((todo, index) => ({
    ...todo!,
    visits: visitsByTodoId[todo!.id], // CRASH
    order: wayfinderOrder[index].order,
}))
```

---

## Required Architectural Patterns

To handle this constraint safely in Starfocus:

### 1. Defensive Query Joins
Never use the non-null assertion operator (`!`) on results returned from `bulkGet` across joined tables. Filter out missing records before accessing properties or passing them downstream:

```typescript
// components/todos/wayfinder.ts
export function attachWayfinderMetadata(
    wayfinderTodos: (Todo | undefined)[],
    visits: Visit[],
    wayfinderOrder: WayfinderOrder[],
    query: string,
    inActiveStarRoles: (todo: Todo) => boolean,
): WayfinderTodoListItem[] {
    const visitsByTodoId = _.groupBy(visits, 'todoId')
    const items: WayfinderTodoListItem[] = []

    for (let index = 0; index < wayfinderTodos.length; index++) {
        const todo = wayfinderTodos[index]
        if (!todo) continue // Safely skip missing / orphaned todos

        const candidateItem: WayfinderTodoListItem = {
            ...todo,
            visits: visitsByTodoId[todo.id],
            order: wayfinderOrder[index].order,
            snoozedUntil: wayfinderOrder[index].snoozedUntil,
        }

        if (matchesQuery(query, candidateItem) && inActiveStarRoles(candidateItem)) {
            items.push(candidateItem)
        }
    }

    return items
}
```

### 2. Self-Healing Orphan Pruning
Provide an explicit reconciliation routine that identifies orphaned references and removes them via `bulkDelete`:

```typescript
// components/todos/repository.ts
async pruneOrphanedWayfinderEntries(): Promise<string[]> {
    const wayfinderEntries = await this.db.wayfinderOrder.toArray()
    if (wayfinderEntries.length === 0) return []

    const todoIds = wayfinderEntries.map(entry => entry.todoId)
    const todos = await this.db.todos.bulkGet(todoIds)
    const orphanedTodoIds = wayfinderEntries
        .filter((_, index) => todos[index] === undefined)
        .map(entry => entry.todoId)

    if (orphanedTodoIds.length > 0) {
        await this.db.wayfinderOrder.bulkDelete(orphanedTodoIds)
    }

    return orphanedTodoIds
}
```

* Run pruning on application mount in `Home.tsx`.
* Opportunistically trigger pruning (deferred outside the Dexie transaction) whenever a query detects `undefined` in `bulkGet` results.
* Include pruning in the "Clean Database" maintenance action.

### 3. Coordinated Local Deletions
Whenever a todo is removed locally, always include all referencing tables in the same read-write transaction:

```typescript
await db.transaction('rw', db.todos, db.wayfinderOrder, db.visits, async () => {
    await Promise.all([
        db.todos.delete(todo.id),
        db.wayfinderOrder.delete(todo.id),
        db.visits.where('todoId').equals(todo.id).delete(),
    ])
})
```
