import { useEffect } from 'react';

const convertDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, (digit) => {
  const code = digit.charCodeAt(0);
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
});

/** Keeps all rendered UI numerals in Western (English) form, including dynamic text. */
export function EnglishDigits() {
  useEffect(() => {
    const updateText = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        if (root.nodeValue) {
          const converted = convertDigits(root.nodeValue);
          if (converted !== root.nodeValue) root.nodeValue = converted;
        }
        return;
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          return parent && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.nodeValue) {
          const converted = convertDigits(node.nodeValue);
          if (converted !== node.nodeValue) node.nodeValue = converted;
        }
      }
      if (root instanceof Element) {
        for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
          for (const attribute of ['placeholder', 'title', 'aria-label']) {
            const value = element.getAttribute(attribute);
            if (value && /[٠-٩۰-۹]/.test(value)) element.setAttribute(attribute, convertDigits(value));
          }
        }
      }
    };
    updateText(document.body);
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === 'characterData' && change.target.nodeValue) {
          const converted = convertDigits(change.target.nodeValue);
          if (converted !== change.target.nodeValue) change.target.nodeValue = converted;
        } else if (change.type === 'attributes' && change.target instanceof Element && change.attributeName) {
          const value = change.target.getAttribute(change.attributeName);
          if (value) {
            const converted = convertDigits(value);
            if (converted !== value) change.target.setAttribute(change.attributeName, converted);
          }
        } else {
          change.addedNodes.forEach((node) => updateText(node));
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
    return () => observer.disconnect();
  }, []);
  return null;
}
