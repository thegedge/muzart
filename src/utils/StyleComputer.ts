import { LayoutElement } from "../layout";

/**
 * Takes a Muzart-specific stylesheet to compute styles for rendered elements.
 *
 * Supported properties:
 * 1. fill
 * 2. stroke
 *
 * Supported selectors
 * 1. Class selector (e.g., ".a" but not ".a.b").
 *
 * Supported combinators:
 * 1. Selector lists (e.g., ".a, .c")
 *
 * Supported at-rules: None
 * Supported functions: None
 *
 * Doesn't consider ordering or specificity right now, but rather just takes the last applicable rule for a style.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference
 */
export class StyleComputer {
  constructor(private readonly stylesheet?: CSSStyleSheet | undefined) {}

  stylesFor(element: LayoutElement, _ancestors: LayoutElement[]): Partial<CSSStyleDeclaration> {
    if (!this.stylesheet) {
      return {};
    }

    const properties: Partial<CSSStyleDeclaration> = {};
    for (let ruleIndex = 0; ruleIndex < this.stylesheet.cssRules.length; ++ruleIndex) {
      const rule = this.stylesheet.cssRules.item(ruleIndex);
      if (!(rule instanceof CSSStyleRule)) {
        continue;
      }

      for (const selector of rule.selectorText.split(",")) {
        const clazz = selector.substring(1);
        if (clazz == this.classForElement(element)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const property of Array.from(rule.style) as any[]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
            properties[property] = rule.style.getPropertyValue(property);
          }
        }
      }
    }
    return properties;
  }

  private classForElement(element: LayoutElement): string {
    return (
      element.type[0].toLowerCase() +
      element.type.substring(1).replaceAll(UPPERCASE_LETTER_REGEXP, (s) => "-" + s.toLowerCase())
    );
  }
}

const UPPERCASE_LETTER_REGEXP = /[A-Z]/g;
