/**
 * A stack-like data structure for supporting undo/redo in the editor.
 *
 * • Actions are pushed onto the stack.
 * • Undoing an action will move the stack head down and redoing an action will move it up.
 * • Pushing an action will delete all actions above the stack head.
 */
export class UndoStack<T> {
  private head = -1;
  private stack: Array<T> = [];

  get length() {
    return this.stack.length;
  }

  clear() {
    this.stack = [];
    this.head = -1;
  }

  push(value: T) {
    this.stack.length = this.head + 1;
    this.stack.push(value);
    this.head += 1;
  }

  undo(): T | undefined {
    if (this.head == -1) {
      return;
    }

    --this.head;
    return this.stack[this.head + 1];
  }

  redo(): T | undefined {
    if (this.head == this.stack.length - 1) {
      return;
    }

    ++this.head;
    return this.stack[this.head];
  }
}
