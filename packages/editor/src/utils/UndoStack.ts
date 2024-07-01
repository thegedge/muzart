/**
 * A stack-like data structure for supporting undo/redo in the editor.
 *
 * • Actions are pushed onto the stack.
 * • Undoing an action will move the stack head down and redoing an action will move it up.
 * • Pushing an action will delete all actions above the stack head.
 */
export class UndoStack<T> implements Iterable<T> {
  private head_ = -1;
  private stack: Array<T> = [];

  get length(): number {
    return this.stack.length;
  }

  get head(): T | undefined {
    return this.stack[this.head_];
  }

  clear(): void {
    this.head_ = -1;
    this.stack = [];
  }

  push(value: T): void {
    this.head_ += 1;
    this.stack.length = this.head_;
    this.stack.push(value);
  }

  undo(): T | undefined {
    if (this.head_ == -1) {
      return;
    }

    --this.head_;
    return this.stack[this.head_ + 1];
  }

  redo(): T | undefined {
    if (this.head_ == this.stack.length - 1) {
      return;
    }

    ++this.head_;
    return this.stack[this.head_];
  }

  toJSON(): Array<T> {
    return [...this.stack.slice(0, this.head_ + 1)];
  }

  [Symbol.iterator](): Iterator<T> {
    return this.stack.values();
  }
}
