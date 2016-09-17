import murmurhash from './murmurhash';
import generate from './generate';
import injectIntoStyleTag from './injectIntoStyleTag';

// An object that keeps track of whether a style has already been injected
const alreadyInjected = {};

// When true, injects do not go to the document, instead, they are stored in a
// buffer and can be extracted
let isStatic = false;
let staticBuffer = '';
let staticBufferClassNames = [];

// It has been suggested tht hashObject takes too long
// On a somewhat complex object
// {a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: {a: 'a', b: 'b', c: 'c'}}
// 10 ** 4 operations takes ~30ms
// This is acceptable so far

// const hashObject = (object) => {
//   if (object['@@narcissus_already_hashed']) {
//     return object['@@narcissus_already_hashed'];
//   }
//   const hash = murmurhash(JSON.stringify(object));
//   object['@@narcissus_already_hashed'] = hash;
//   asap(() => {
//     delete object['@@narcissus_already_hashed'];
//     if (hash !== murmurhash(JSON.stringify(object))) {
//       console.warn('hashObject has cached an object\'s hash, but the hash is not the same anymore, so you have mutated the object passed in');
//     }
//     object['@@narcissus_already_hashed'] = hash;
//   });
//   return hash;
// };

const hashObject = (object) => murmurhash(JSON.stringify(object));

/**
 * Inside a React render function, this might look like...
 * return <div className={inject({ backgroundColor: 'blue' })}/>;
 *
 * Takes an object, and returns a class name
 */
export function inject(object) {
  if (!object) {
    console.error('[narcissus] you are trying to inject a non object');
    return '';
  }

  const hash = hashObject(object);

  // The returned className cannot start with a number!
  const className = 'narcissus_' + hash;

  if (alreadyInjected[className]) {
    return className;
  }

  const generatedCSS = generate('.' + className, object);

  if (isStatic) {
    staticBuffer += generatedCSS;
    staticBufferClassNames.push(className);
  } else {
    injectIntoStyleTag(generatedCSS);
    alreadyInjected[className] = true;
  }

  return className;
}

/**
 * Start the static rendering process
 */
export function startStatic() {
  isStatic = true;
}

/**
 * This is not using jsdoc properly is it
 * Returns a tuple containing [ css, classNames ]
 * css is the string that should be injected into the head
 * classNames is an array of classNames that have been used (use with rehydrate to be more efficient)
 */
export function stopStatic() {
  isStatic = false;

  const ret = [ staticBuffer, staticBufferClassNames ];

  // Reset the buffers
  staticBuffer = '';
  staticBufferClassNames = [];

  return ret;
}

/**
 * Takes an array of classnames, and marks them as already injected
 * @param {Array<String>} classNames
 */
export function rehydrate(classNames) {
  classNames.forEach(className => {
    alreadyInjected[className] = true;
  });
}
