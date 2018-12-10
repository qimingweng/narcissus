/**
 * By the way, the whole point here is to be able to write nested css declarations
 * Let's not forget that
 */

import { prefix } from 'inline-style-prefixer';
import isUnitlessNumber from './isUnitlessNumber';
import kebabifyStyleName from './kebabifyStyleName';

const objectToPairs = (obj) => Object.keys(obj).map(key => [ key, obj[key] ]);
const flatten = (list) => list.reduce((memo, x) => memo.concat(x), []);
const stringifyValue = (key, prop) => {
  if (typeof prop === 'number') {
    if (isUnitlessNumber[key]) {
      return '' + prop; // Forces into a string
    }
    return prop + 'px'; // Adds a px
  }
  return prop;
};

// This generates one ruleset
// With one selector and a set of declarations
const generateCSSRuleset = (
  selector,
  declarations
) => {
  const prefixedDeclarations = prefix(declarations);
  const prefixedRules = flatten(
    objectToPairs(prefixedDeclarations).map(([ key, value ]) => {
      if (Array.isArray(value)) {
        // inline-style-prefix-all returns an array when there should be
        // multiple rules, we will flatten to single rules

        const prefixedValues = [];
        const unprefixedValues = [];

        value.forEach(v => {
          if (v.indexOf('-') === 0) {
            prefixedValues.push(v);
          } else {
            unprefixedValues.push(v);
          }
        });

        prefixedValues.sort();
        unprefixedValues.sort();

        return prefixedValues
          .concat(unprefixedValues)
          .map(v => [ key, v ]);
      }
      return [ [ key, value ] ];
    })
  );

  const rules = prefixedRules.map(([ key, value ]) => {
    const stringValue = stringifyValue(key, value);
    return `${kebabifyStyleName(key)}:${stringValue};`;
  }).join('');

  if (rules) {
    return `${selector}{${rules}}`;
  }
  return '';
};

const generate = (selector, object) => {
  // Main styles
  const mainStyles = {};
  // Collection of styles that apply to slightly different selectors
  const extraStyles = {};
  // Media styles
  // If one of the keys starts with a @, it is added to mediaStyles
  const mediaStyles = {};

  // Separate main styles from extra styles based on the '&&' character at the
  // beginning
  Object.keys(object).forEach(key => {
    if (key[0] === '@') {
      // Media
      mediaStyles[key] = object[key];
    } else if (key.slice(0, 2) === '&&') {
      const appended = key.slice(2);
      extraStyles[appended] = object[key];
    } else {
      mainStyles[key] = object[key];
    }
  });

  const rules = generateCSSRuleset(selector, mainStyles);

  const extraRules = Object.keys(extraStyles).map(key => {
    const suffix = key;
    // Keys here are the additions to be added to the className
    return generateCSSRuleset(selector + suffix, extraStyles[key]);
  }).join('');

  const mediaRules = Object.keys(mediaStyles).map(key => {
    const media = key;
    const ruleText = generate(selector, mediaStyles[key]);
    return `${media}{${ruleText}}`;
  }).join('');

  return rules + extraRules + mediaRules;
};

export default generate;
