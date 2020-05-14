export default class TextNodeFiller {
  constructor() {
    this.middlewares = [];
  }

  use(callback) {
    this.middlewares.push(callback);
  }

  parse(container) {
    // let result = text;
    this.middlewares.forEach((m) => {
      m.call(null, container);
    });
  }
}

TextNodeFiller.searchLinks = function searchLinks(container) {
  if (!container.hasChildNodes) return;

  const children = container.childNodes;
  const newNodes = [];
  children.forEach((c) => {
    if (c.nodeType !== 3) return;
    c.textContent.replace(/https?:\/\/[-a-zA-Z0-9()@:%_+.~#?&//=]*/, (match, offset, input) => {
      newNodes.push(document.createTextNode(input.slice(0, offset)));
      const a = document.createElement('a');
      a.href = match;
      a.textContent = match;
      newNodes.push(a);
      const nextTextNode = document.createElement('span');
      nextTextNode.append(document.createTextNode(input.slice(offset + match.length)));
      newNodes.push(nextTextNode);
      searchLinks(nextTextNode);
      return match;
    });
    if (newNodes.length) {
      newNodes.forEach((n) => c.before(n));
      c.remove();
    }
  });
};
