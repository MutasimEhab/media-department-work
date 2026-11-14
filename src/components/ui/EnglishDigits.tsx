import { useLayoutEffect } from 'react';

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const hasNonLatinDigits = /[٠-٩۰-۹]/;

export const toEnglishDigits = (value: string) => value.replace(ARABIC_DIGITS, digit => {
  const code = digit.charCodeAt(0);
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
});

/** Enforces Latin digits in rendered text, dynamic values, and localized browser controls. */
export function EnglishDigits() {
  useLayoutEffect(() => {
    document.documentElement.lang = 'ar-u-nu-latn';

    const isProtectedInput = (element: HTMLInputElement) =>
      ['password', 'button', 'submit', 'reset', 'hidden', 'checkbox', 'radio', 'file'].includes(element.type);

    const convertControlValue = (element: Element) => {
      if (element instanceof HTMLInputElement) {
        const isNativeDateTime = ['date', 'time', 'month', 'datetime-local', 'week'].includes(element.type);
        if (isNativeDateTime) {
          element.lang = 'en-US';
          element.dir = 'ltr';
          element.style.fontVariantNumeric = 'lining-nums';
          return;
        }
        if (isProtectedInput(element)) return;
      }
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return;
      const converted = toEnglishDigits(element.value);
      if (converted === element.value) return;
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
        : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, converted);
    };

    const updateText = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        if (root.nodeValue && hasNonLatinDigits.test(root.nodeValue)) root.nodeValue = toEnglishDigits(root.nodeValue);
        return;
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          return parent && !['SCRIPT', 'STYLE'].includes(parent.tagName)
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && hasNonLatinDigits.test(node.nodeValue)) node.nodeValue = toEnglishDigits(node.nodeValue);
      }
      const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : [];
      for (const element of elements) {
        convertControlValue(element);
        for (const attribute of ['placeholder', 'title', 'aria-label', 'value']) {
          const value = element.getAttribute(attribute);
          if (value && hasNonLatinDigits.test(value)) element.setAttribute(attribute, toEnglishDigits(value));
        }
      }
    };

    // Patch DOM value setters so values loaded or updated programmatically stay Latin too.
    const restoreSetters: Array<() => void> = [];
    for (const prototype of [HTMLInputElement.prototype, HTMLTextAreaElement.prototype, HTMLSelectElement.prototype]) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (!descriptor?.get || !descriptor.set || !descriptor.configurable) continue;
      Object.defineProperty(prototype, 'value', {
        ...descriptor,
        set(this: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
          const normalized = this instanceof HTMLInputElement && isProtectedInput(this) ? value : toEnglishDigits(String(value));
          descriptor.set!.call(this, normalized);
        },
      });
      restoreSetters.push(() => Object.defineProperty(prototype, 'value', descriptor));
    }

    updateText(document.body);
    const onInput = (event: Event) => {
      if (event.target instanceof Element) convertControlValue(event.target);
    };
    document.addEventListener('input', onInput, true);
    const observer = new MutationObserver(changes => {
      for (const change of changes) {
        if (change.type === 'characterData' && change.target.nodeValue) {
          const value = change.target.nodeValue;
          if (hasNonLatinDigits.test(value)) change.target.nodeValue = toEnglishDigits(value);
        } else if (change.type === 'attributes' && change.target instanceof Element && change.attributeName) {
          const value = change.target.getAttribute(change.attributeName);
          if (value && hasNonLatinDigits.test(value)) change.target.setAttribute(change.attributeName, toEnglishDigits(value));
          if (['value', 'type', 'lang'].includes(change.attributeName)) convertControlValue(change.target);
        } else {
          change.addedNodes.forEach(updateText);
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'value', 'type', 'lang'] });
    return () => {
      observer.disconnect();
      document.removeEventListener('input', onInput, true);
      restoreSetters.forEach(restore => restore());
    };
  }, []);
  return null;
}
