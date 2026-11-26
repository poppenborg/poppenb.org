// @ts-check
/**
 * External links open in a new tab (SPEC.md "Links"). A link is external when
 * it is an absolute http(s) URL to another host than the site's own.
 * mailto: and other schemes stay as they are, since they don't open a page.
 *
 * Used in two places, so the rule lives once:
 *  - components spread `externalAttrs(url)` onto their <a> tags;
 *  - astro.config.mjs runs `externalLinksPlugin` over every Markdown entry,
 *    because src/content/ is plain Markdown that can't carry attributes.
 */

const SITE_HOST = 'poppenb.org';

/** True for an absolute http(s) URL that leaves the site. */
export function isExternal(/** @type {string} */ href) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    return host !== SITE_HOST;
  } catch {
    return false;
  }
}

/** Attributes for an <a>: opens in a new tab when external, nothing otherwise. */
export function externalAttrs(/** @type {string} */ href) {
  return isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

/**
 * Sätteri hast plugin (Astro 7's Markdown processor): adds target="_blank" and
 * rel="noopener noreferrer" to every external <a> in rendered Markdown,
 * keeping any rel values already there.
 */
export const externalLinksPlugin = {
  name: 'external-links',
  element: {
    filter: ['a'],
    /** @param {any} node @param {any} ctx */
    visit(node, ctx) {
      const href = String(node.properties?.href ?? '');
      if (!isExternal(href)) return;
      const rel = [].concat(node.properties?.rel ?? []).flatMap((r) => String(r).split(/\s+/));
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', [...new Set([...rel, 'noopener', 'noreferrer'])].filter(Boolean));
    },
  },
};
