// Blatantly copied from inject.js in aphrodite

// Inject a string of styles into a <style> tag in the head of the document. This
// will automatically create a style tag and then continue to use it for
// multiple injections. It will also use a style tag with the `data-aphrodite`
// tag on it if that exists in the DOM. This could be used for e.g. reusing the
// same style tag that server-side rendering inserts.

// Cache this for speed
let styleTag = null;

const injectIntoStyleTag = (cssContents) => {
  if (typeof document === 'undefined') {
    // Don't do this in non document environments
    return;
  }

  if (styleTag == null) {
    // Try to find a style tag with the `data-narcissus` attribute first.
    styleTag = document.querySelector('style[data-narcissus]');

    // If that doesn't work, generate a new style tag.
    if (styleTag == null) {
      // Taken from
      // http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
      const head = document.head || document.getElementsByTagName('head')[0];
      styleTag = document.createElement('style');

      styleTag.type = 'text/css';
      styleTag.setAttribute('data-narcissus', '');
      head.appendChild(styleTag);
    }
  }

  if (styleTag.styleSheet) {
    // The style tag already has contents
    styleTag.styleSheet.cssText += cssContents;
  } else {
    // Most likely, you get to this else statement if the style tag was just
    // generated
    styleTag.appendChild(document.createTextNode(cssContents));
  }
};

export default injectIntoStyleTag;
