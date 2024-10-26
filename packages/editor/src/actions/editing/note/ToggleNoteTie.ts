import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class ToggleNoteTie extends Action {
  static readonly name = "Toggle note tie";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "t";

  static actionForState(application: Application) {
    const chord = application.selection.chord?.chord;
    if (!chord) {
      return null;
    }

    const instrument = application.selection.part?.part.instrument;
    const string = application.selection.noteIndex + 1;

    let note = application.selection.note?.note;
    let previous: notation.TiePoint | undefined;
    switch (note?.tie?.type) {
      case "middle":
      case "stop":
        previous = note.tie.previous;
        break;
      case "start":
      case undefined: {
        if (!application.selection.part) {
          throw new Error("No part selected");
        }

        let measureIndex: number;
        let chordIndex: number;

        const isFirstChord = application.selection.chordIndex == 0;
        const isFirstMeasure = application.selection.measureIndex == 0;
        if (isFirstChord && isFirstMeasure) {
          throw new Error("Cannot tie first note in first measure");
        } else if (isFirstChord) {
          measureIndex = application.selection.measureIndex - 1;
          chordIndex = application.selection.part.part.measures[measureIndex].chords.length - 1;
        } else {
          measureIndex = application.selection.measureIndex;
          chordIndex = application.selection.chordIndex - 1;
        }

        // Go backwards on this string until we find a note on the same string
        while (measureIndex > 0) {
          const measure = application.selection.part.part.measures[measureIndex];
          const chord = measure.chords[chordIndex];
          const note = chord.noteByString(string);
          if (note) {
            previous = new notation.TiePoint(chord, note);
            break;
          }

          chordIndex--;
          if (chordIndex < 0) {
            measureIndex--;
            chordIndex = application.selection.part.part.measures[measureIndex].chords.length - 1;
          }
        }
        break;
      }
    }

    // TODO user could be placing a tie in the middle of an existing tie, so we also need to
    //      look for the next note and check to see if it's a tie.

    if (!previous) {
      return null;
    }

    if (!note) {
      if (instrument instanceof notation.StringInstrument) {
        note = new notation.Note({
          value: chord.value,
          pitch: previous.note.pitch,
          placement: previous.note.placement,
        });
      } else {
        throw new Error("Not yet implemented for instrument");
      }
    }

    return new ToggleNoteTie(chord, note, previous);
  }

  private isNewNote: boolean;

  private previousNote: notation.Note;

  private nextChord: notation.Chord | undefined;
  private nextNote: notation.Note | undefined;

  constructor(
    private chord: notation.Chord,
    private note: notation.Note,
    private previous: notation.TiePoint,
  ) {
    super();
    this.isNewNote = !chord.notes.includes(note);
    this.previousNote = previous.note;
    this.nextChord = (note.tie?.next ?? previous.note.tie?.next)?.chord;
    this.nextNote = (note.tie?.next ?? previous.note.tie?.next)?.note;
  }

  apply(_application: Application) {
    let previousTie: notation.Tie | undefined = undefined;
    let currentTie: notation.Tie | undefined = undefined;
    let nextTie: notation.Tie | undefined = undefined;

    switch (this.note.tie?.type) {
      case "middle": {
        switch (this.previous.note.tie?.type) {
          case "middle":
            previousTie = {
              type: "stop",
              previous: this.previous.note.tie.previous,
            };
            break;
          case "start":
            previousTie = undefined;
            break;
          default:
            throw new Error("Unexpected previous tie type");
        }

        currentTie = {
          type: "start",
          next: this.note.tie.next,
        };

        break;
      }
      case "stop": {
        switch (this.previous.note.tie?.type) {
          case "middle":
            previousTie = {
              type: "stop",
              previous: this.previous.note.tie.previous,
            };
            break;
          case "start":
            previousTie = undefined;
            break;
          default:
            throw new Error("Unexpected previous tie type");
        }

        currentTie = undefined;

        break;
      }
      case "start": {
        switch (this.previous.note.tie?.type) {
          case "stop":
            previousTie = {
              type: "middle",
              previous: this.previous.note.tie.previous,
              next: new notation.TiePoint(this.chord, this.note),
            };
            break;
          case undefined:
            previousTie = {
              type: "start",
              next: new notation.TiePoint(this.chord, this.note),
            };
            break;
          default:
            throw new Error("Unexpected previous tie type");
        }

        currentTie = {
          type: "middle",
          previous: new notation.TiePoint(this.previous.chord, this.previous.note),
          next: this.note.tie.next,
        };

        break;
      }
      case undefined: {
        switch (this.previous.note.tie?.type) {
          case "start":
          case "middle": {
            // only if creating a new note
            previousTie = {
              ...this.previous.note.tie,
              next: new notation.TiePoint(this.chord, this.note),
            };

            currentTie = {
              type: "middle",
              previous: new notation.TiePoint(this.previous.chord, this.previous.note),
              next: this.previous.note.tie.next,
            };

            const existingNextTie = this.previous.note.tie.next.note.tie;
            switch (existingNextTie?.type) {
              case "stop":
              case "middle":
                nextTie = {
                  ...existingNextTie,
                  previous: new notation.TiePoint(this.chord, this.note),
                };
                break;
              default:
                throw new Error("Unexpected next tie type");
            }

            break;
          }
          case "stop":
            previousTie = {
              type: "middle",
              previous: this.previous.note.tie.previous,
              next: new notation.TiePoint(this.chord, this.note),
            };

            currentTie = {
              type: "stop",
              previous: new notation.TiePoint(this.previous.chord, this.previous.note),
            };
            break;
          case undefined:
            previousTie = {
              type: "start",
              next: new notation.TiePoint(this.chord, this.note),
            };

            currentTie = {
              type: "stop",
              previous: new notation.TiePoint(this.previous.chord, this.previous.note),
            };

            break;
          default:
            throw new Error("Unexpected previous tie type");
        }

        break;
      }
    }

    this.previous.chord.changeNote(
      this.previous.note.withChanges({
        id: this.previous.note.id,
        tie: previousTie,
      }),
    );

    this.chord.changeNote(
      this.note.withChanges({
        id: this.note.id,
        tie: currentTie,
      }),
    );

    if (this.nextChord && this.nextNote) {
      this.nextChord.changeNote(
        this.nextNote.withChanges({
          id: this.nextNote.id,
          tie: nextTie,
        }),
      );
    }
  }

  undo(_application: Application) {
    this.previous.chord.changeNote(this.previousNote);

    if (this.isNewNote) {
      this.chord.removeNote(this.note);
    } else {
      this.chord.changeNote(this.note);
    }

    if (this.nextNote && this.nextChord) {
      this.nextChord.changeNote(this.nextNote);
    }
  }
}
