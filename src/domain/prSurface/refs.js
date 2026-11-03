// Reference helpers. Only github.com HTML URLs are allowed out of the view model:
// no api.github.com, no raw/javascript/data URLs.
const GITHUB_HTML = /^https:\/\/github\.com\/[^\s]+$/;

export const isGithubHtmlUrl = (url) => typeof url === 'string' && GITHUB_HTML.test(url);

export const ref = (label, url, kind = 'link') => (isGithubHtmlUrl(url) ? { label, url, kind } : null);

export const compactRefs = (refs) => {
  const seen = new Set();
  return refs.filter((r) => {
    if (!r || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
};
