# narcissus

## Inline styles, sane

[![npm](https://img.shields.io/npm/v/narcissus.svg?style=flat-square)](https://www.npmjs.com/package/narcissus)

Narcissus is inline style sheets in Javascript, but sane. It borrows and steals many concepts from [aphrodite](https://github.com/Khan/aphrodite), but extends certain ideas and simplifies the codebase.

Quick feature list:
- Supports server side rendering
- Does not generate CSS files
- Supports media queries
- Supports pseudo selectors `:hover`
- Supports child selectors `.parent .child { ... }`
- Small in size

## Quick API documentation

Narcissus exports an inject function. This takes a plain javascript object and returns a hashed class name.

```js
import { inject } from 'narcissus';

const className = inject({
  backgroundColor: 'blue',
});
```

You could then use this className however you like. One popular use case is within react components.

```js
const Component = (props) => {
  return <div
    className={inject({
      backgroundColor: 'blue',
    })}
  >
    Hello there
  </div>;
};
```

## Plain object documentation

Narcissus takes objects like React's inline styles

```js
{
  backgroundColor: 'blue',
  fontSize: 14,
}
```

Narcissus does that whole browser prefix thing, well, we use [inline-style-prefixer/static](https://github.com/rofrischmann/inline-style-prefixer).

```js
{
  backgroundColor: 'blue',
  userSelect: 'none',
}

// Outputs (added spaces for readability)
// .narcissus_1wbu9hn {
//   background-color:blue;
//   user-select:none;
//   -webkit-user-select:none;
//   -moz-user-select:none;
//   -ms-user-select:none;
// }
```

Narcissus handles media queries

```js
{
  backgroundColor: 'blue',
  '@media (max-width: 800px)': {
    backgroundColor: 'red',
  },
}

// Outputs (added spaces for readability)
// .narcissus_1fxua3d {
//   background-color:blue;
// }
// @media (max-width: 800px){
//   .narcissus_1fxua3d{
//     background-color:red;
//   }
// }
```

Narcissus also lets you add `:hover`, `:active`, and sub selectors by using a selector extension API. Any key that starts with `&&` (not `&` since that already means something in CSS) is automatically added to the resulting selector.

So...

```js
{
  backgroundColor: 'blue',
  '&&:hover': {
    backgroundColor: 'red',
  },
  '&& h1': {
    // All h1s underneath this class will have the following styles...
    backgroundColor: 'green',
  },
  '@media (max-width: 800px)': {
    '&&:hover': {
      backgroundColor: 'purple',
    },
  },
}

// Outputs (added spaces for readability)
// .narcissus_1xdcqz1 {
//   background-color:blue;
// }
// .narcissus_1xdcqz1:hover {
//   background-color:red;
// }
// .narcissus_1xdcqz1 h1 {
//   background-color:green;
// }
// @media (max-width: 800px) {
//   .narcissus_1xdcqz1:hover {
//     background-color:purple;
//   }
// }
```

## How does narcissus work, a story

CSS (cascading style sheets) are made up of selectors and style definitions...
You probably already know this.

```css
.some_class_name {
  background-color: blue;
}
```

You can link to css files inside the `<head>` of an html file with a `<link>`, but you can also insert them inside the html file itself!

```html
<html>
  <head>
    <style>
      .some_class_name {
        background-color: blue;
      }
    </style>
  </head>
  <body>
  </body>
</html>
```

If you're using the DOM API, you can insert *anything* into the HTML, so...

What if... you inserted a CSS string, generated in Javascript, into the head?

You take a plain object...

```js
{
  backgroundColor: 'blue',
}
```

You transform it into a string...

```js
'{background-color:blue;}'
```

Give it a class name that is deterministic based on hashing the object... I'll talk about why determinism is important for narcissus below.

```js
'.hashed_class_name{background-color:blue;}'
```

So what if we wrote a function that injected that string into the head... and returned the generated class name? Then maybe we can do this...

```js
const Component = (props) => {
  return <div
    className={inject({
      backgroundColor: 'blue',
    })}
  />
};
```

## Why not just use inline styles?

Good question, simply because inline styles do not support hovering or media queries the same way that CSS does.

I would love it if we didn't need to hack around CSS at all and if you could style everything inline!

```js
const Component = (props) => {
  return <div
    className={inject({
      backgroundColor: 'blue',
      '&&:hover': {
        backgroundColor: 'red',
      },
      '@media (min-width: 800px)': {
        backgroundColor: 'purple',
      },
    })}
  />
};
```

## Why not just use separate stylesheets?

This is more of a philosophical debate. There are many authors who have articulated the difference between the old HTML/CSS way of writing code and this idea of a component that React has popularized.

Here's my take:

- **Keep the style and the component code closer:** not only is the source code literally closer, they are now in the same file, the coupling of a style is closer to the component that is being used. We are not writing selectors that have generic names that may collide with code we write in the future. Narcissus doesn't need to namespace it's selectors because hashing the object effectively does the same thing.

- **Components should be reusable:** some components are logical components, and do not care about styles. Those components are reused easily. However, some components, like buttons, should be very specific about how they look no matter where you put them. I believe that such components have a responsibility to define their own styles as tightly as necessary and not allow arbitrary CSS overrides. I believe in a world where you can download a React component from npm, and not have to insert a separate stylesheet somewhere else in the application. You should only need to `require()` a component once.

## Why is determinism important?

Narcissus could have been written with a counter, and each new class name that was generated would just get an incrementally higher value. However, when deploying Javascript in universal environments, as we do at Edusight, we need the react objects the client side generates to exactly match up with the react objects the server generates. Here, using a hash of the style object means the server and client will always agree what class name to generate.

## Using narcissus on server side

```js
import { startStatic, stopStatic, inject } from 'narcissus';

// First, startStatic to let narcissus know you are on the server
startStatic();

// Then do all your injection (if you're using react, all your react rendering with the injects in the render function)
inject({ backgroundColor: 'blue' });
inject({ backgroundColor: 'red' });

// Stop and extract the css
// css is the stylesheet string that should be injected into the head
// classNames is an array of generated classNames that you can use to tell narcissus on the client to not rehash
const [ css, classNames ] = stopStatic();

// Some magical serve file
serve(`<html>
  <head>
    <!-- The narcissus tag is used so that narcissus can consistently find itself -->
    <style data-narcissus>
      ${css}
    </style>
  </head>
  <body>
    <script>
      // I'm using ES6 syntax here so it won't actually work, but this is close to what you need
      import { rehydrate } from 'narcissus';
      var CLASSNAMES = ${JSON.stringify(classNames)}
      rehydrate(CLASSNAMES);
    </script>
  </body>
</html>`);
```
