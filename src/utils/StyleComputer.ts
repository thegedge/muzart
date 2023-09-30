import * as CSS from "csstype";
import { camelCase } from "lodash";
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
export class StyleComputer<ElementType extends LayoutElement = LayoutElement> {
  constructor(private readonly stylesheet?: CSSStyleSheet | undefined) {}

  stylesFor(element: ElementType, _ancestors: ElementType[]): CSS.Properties {
    if (!this.stylesheet) {
      return {};
    }

    const properties: CSS.Properties = {};
    for (let ruleIndex = 0; ruleIndex < this.stylesheet.cssRules.length; ++ruleIndex) {
      const rule = this.stylesheet.cssRules.item(ruleIndex);
      if (!(rule instanceof CSSStyleRule)) {
        continue;
      }

      for (const selector of rule.selectorText.split(",")) {
        let clazz: string;
        let attribute: [keyof ElementType, string] | undefined; // [name, value]

        if (selector.includes("[")) {
          const [first, ...rest] = selector.split("[");
          const attributeSelector = rest.join("").slice(0, -1);
          const [name, value] = attributeSelector.split("=");
          clazz = first.substring(1);
          attribute = [name as keyof ElementType, value.slice(1, -1)];
        } else {
          clazz = selector.substring(1);
        }

        if (clazz != this.classForElement(element)) {
          continue;
        }

        if (attribute && !(attribute[0] in element && String(element[attribute[0]]) == attribute[1])) {
          continue;
        }

        for (const property of Array.from(rule.style)) {
          const camelCasedProperty = camelCase(property);
          (properties as Record<string, unknown>)[camelCasedProperty] = rule.style.getPropertyValue(property);
        }
      }
    }
    return properties;
  }

  private classForElement(element: ElementType): string {
    return (
      element.type[0].toLowerCase() +
      element.type.substring(1).replaceAll(UPPERCASE_LETTER_REGEXP, (s) => "-" + s.toLowerCase())
    );
  }
}

const UPPERCASE_LETTER_REGEXP = /[A-Z]/g;
