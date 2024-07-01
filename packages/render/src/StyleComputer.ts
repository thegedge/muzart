import { type AnyLayoutElement } from "@muzart/layout";
import type * as CSS from "csstype";
import { camelCase } from "lodash";

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
export class StyleComputer<ElementType extends AnyLayoutElement = AnyLayoutElement> {
  private rules: {
    rule: CSSStyleRule;
    class: string;
    attribute: [keyof ElementType, string] | undefined;
    styles: CSS.Properties;
  }[] = [];

  constructor(stylesheet?: CSSStyleSheet | undefined) {
    if (stylesheet) {
      for (let ruleIndex = 0; ruleIndex < stylesheet.cssRules.length; ++ruleIndex) {
        const rule = stylesheet.cssRules.item(ruleIndex);
        if (!(rule instanceof CSSStyleRule)) {
          continue;
        }

        const styles = Object.fromEntries(
          Array.from(rule.style).map((property) => [camelCase(property), rule.style.getPropertyValue(property)]),
        );

        for (const selector of rule.selectorText.split(",")) {
          let clazz: string;
          let attribute: [keyof ElementType, string] | undefined; // [name, value]

          if (selector.includes("[")) {
            const [first, ...rest] = selector.split("[");
            const attributeSelector = rest.join("").slice(0, -1);
            const [name, value] = attributeSelector.split("=");
            clazz = first.substring(1);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            attribute = [name as keyof ElementType, value?.slice(1, -1)];
          } else {
            clazz = selector.substring(1);
          }

          this.rules.push({
            rule,
            class: clazz,
            attribute,
            styles,
          });
        }
      }
    }
  }

  stylesFor(element: ElementType, _ancestors: ElementType[]): CSS.Properties {
    const properties: CSS.Properties = {};
    const elementClass = this.classForElement(element);
    for (const rule of this.rules) {
      if (rule.class != elementClass) {
        continue;
      }

      if (
        rule.attribute &&
        !(rule.attribute[0] in element && String(element[rule.attribute[0]]) == rule.attribute[1])
      ) {
        continue;
      }

      Object.assign(properties, rule.styles);
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
