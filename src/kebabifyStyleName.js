/** Blatantly stolen from aphrodite */

const UPPERCASE_RE = /([A-Z])/g;
const MS_RE = /^ms-/;

const kebabify = (string) => string.replace(UPPERCASE_RE, '-$1').toLowerCase();
const kebabifyStyleName = (string) => kebabify(string).replace(MS_RE, '-ms-');
export default kebabifyStyleName;
