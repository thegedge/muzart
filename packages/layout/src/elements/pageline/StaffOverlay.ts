import * as notation from "@muzart/notation";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../constants";
import { SimpleGroupElement } from "../../layouts/SimpleGroup";
import { Box } from "../../utils/Box";
import { Arc } from "../Arc";
import { Chord } from "../Chord";
import type { AnyLayoutElement } from "../LayoutElement";
import type { Measure } from "../Measure";
import { Slide } from "../Slide";

interface StaffElement {
  element: AnyLayoutElement;
  measure: Measure;
}

export class StaffOverlay extends SimpleGroupElement<AnyLayoutElement> {
  private staffElements: ReadonlyArray<StaffElement> = [];

  setStaffElements(staffElements: ReadonlyArray<StaffElement>) {
    this.staffElements = staffElements;
  }

  layout() {
    this.layOutTies();
    this.layOutSlides();
    this.layOutHammerOnPullOffs();
    super.layout();
  }

  private layOutHammerOnPullOffs() {
    // TODO we only draw these between adjacent chords, but nice-looking tabs typically draw runs of these as one
    // TODO tabs sometimes put a P/H above to indicate whether it's a hammer on or pull off

    this.staffElements.forEach(({ element, measure }, index) => {
      if (!(element instanceof Chord)) {
        return;
      }

      for (const note of element.chord.notes) {
        if (!note.hammerOnPullOff) {
          continue;
        }

        const x = measure.box.x + element.box.centerX;

        // Find the next chord that we're sliding into
        let nextElemIndex = index + 1;
        let w = STAFF_LINE_HEIGHT;
        if (nextElemIndex < this.staffElements.length) {
          w = 0.5 * element.box.width;
          do {
            const elem = this.staffElements[nextElemIndex].element;
            if (elem.type === "Chord") {
              w += 0.5 * elem.box.width;
              break;
            }

            nextElemIndex += 1;
            w += elem.box.width;
          } while (nextElemIndex < this.staffElements.length);
        }

        this.addElement(
          new Arc(
            new Box(
              x,
              measure.box.y + element.box.y + STAFF_LINE_HEIGHT * ((note.placement?.string || 1) - 1.6),
              w,
              0.7 * STAFF_LINE_HEIGHT,
            ),
            "above",
          ),
        );
      }
    });
  }

  private layOutSlides() {
    const yoffset = LINE_STROKE_WIDTH * 3;
    this.staffElements.forEach(({ element, measure }, index) => {
      if (!(element instanceof Chord)) {
        return;
      }

      for (const note of element.chord.notes) {
        if (!note.slide) {
          continue;
        }

        let x, w;
        switch (note.slide.type) {
          case notation.SlideType.ShiftSlide:
          case notation.SlideType.LegatoSlide: {
            x = measure.box.x + element.box.right;

            // Find the next chord that we're sliding into
            let nextElemIndex = index + 1;
            if (nextElemIndex == this.staffElements.length) {
              w = STAFF_LINE_HEIGHT;
            } else {
              w = 0;
              do {
                const elem = this.staffElements[nextElemIndex].element;
                if (elem.type === "Chord") {
                  break;
                }

                nextElemIndex += 1;
                w += elem.box.width;
              } while (nextElemIndex < this.staffElements.length);
            }
            break;
          }

          // TODO these look wrong for measures 90 and 91 of "Sweet Child of Mine" (need to look at surrounding notes)

          case notation.SlideType.SlideIntoFromAbove:
          case notation.SlideType.SlideIntoFromBelow: {
            w = STAFF_LINE_HEIGHT;
            x = measure.box.x + element.box.x - w;
            break;
          }
          case notation.SlideType.SlideOutDownwards:
          case notation.SlideType.SlideOutUpwards: {
            x = measure.box.x + element.box.right;
            w = STAFF_LINE_HEIGHT;
            break;
          }
        }

        this.addElement(
          new Slide(
            new Box(
              x,
              measure.box.y + element.box.y + STAFF_LINE_HEIGHT * ((note.placement?.string || 1) - 1) + yoffset,
              w,
              STAFF_LINE_HEIGHT - 2 * yoffset,
            ),
            note.slide.upwards,
          ),
        );
      }
    });
  }

  private layOutTies() {
    // TODO unfortunate to have to do this `as`, but we want to make the `forEach` function below simpler by only considering chords
    const chords = this.staffElements.filter(({ element }) => element instanceof Chord) as {
      element: Chord;
      measure: Measure;
    }[];

    chords.forEach(({ element, measure }, index) => {
      for (const note of element.chord.notes) {
        // If the very first chord in the line has a tie, create an arc to show that
        if (note.tie?.previous && index === 0) {
          this.addElement(
            new Arc(
              new Box(
                measure.box.x,
                measure.box.y + element.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
                STAFF_LINE_HEIGHT,
                0.5 * STAFF_LINE_HEIGHT,
              ),
            ),
          );
        }

        if (note.tie?.next) {
          let tieEnd: { element: Chord; measure: Measure } | undefined;
          for (let endIndex = index + 1; endIndex < chords.length; ++endIndex) {
            if (chords[endIndex].element.chord == note.tie.next.chord) {
              tieEnd = chords[endIndex];
              break;
            }
          }

          const x = measure.box.x + element.box.centerX;
          let width;
          if (tieEnd) {
            width = tieEnd.measure.box.x + tieEnd.element.box.centerX - x;
          } else {
            width = this.box.right - x;
          }

          this.addElement(
            new Arc(
              new Box(
                x,
                measure.box.y + element.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
                width,
                0.5 * STAFF_LINE_HEIGHT,
              ),
            ),
          );
        }
      }
    });
  }
}
