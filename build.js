const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const WRITING_DIR = path.join(__dirname, 'writing');
const TEMPLATE = path.join(__dirname, 'template.html');
const OUTPUT = path.join(__dirname, 'index.html');

marked.setOptions({ gfm: true, breaks: false });

const files = fs.readdirSync(WRITING_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const raw = fs.readFileSync(path.join(WRITING_DIR, f), 'utf8');
    const { data, content } = matter(raw);
    const slug = path.basename(f, '.md');
    return { slug, ...data, content };
  });

files.sort((a, b) => {
  if (a.date === 'ongoing') return -1;
  if (b.date === 'ongoing') return 1;
  return new Date(b.date) - new Date(a.date);
});

const listRows = files.map((entry, i) => {
  const num = i + 1;
  const tag = (entry.tag || '').toUpperCase();
  const title = entry.title.toUpperCase();
  return `      <li class="row" data-id="${entry.slug}" data-tag="${entry.tag || ''}">
        <span class="gut"><span class="hash">#</span><span class="num">${num}</span></span>
        <span class="ttl">${escapeHtml(title)}</span>
      </li>`;
}).join('\n');

const detailArticles = files.map(entry => {
  const tag = (entry.tag || '').toUpperCase();
  const dateStr = entry.date instanceof Date ? entry.date.toISOString().slice(0, 10) : entry.date;
  const datePart = dateStr ? `<span><span class="k">date</span> ${dateStr}</span>` : '';
  const locationPart = entry.location ? `<span><span class="k">location</span> ${escapeHtml(entry.location)}</span>` : '';
  const body = marked.parse(entry.content.trim());

  return `    <article class="detail" data-id="${entry.slug}">
      <div class="meta"><span><span class="k">type</span> ${escapeHtml(tag)}</span>${datePart}${locationPart}</div>
      <h1>${escapeHtml(entry.title)}</h1>
      ${body}
    </article>`;
}).join('\n\n');

const template = fs.readFileSync(TEMPLATE, 'utf8');
const output = template
  .replace('{{LIST_ROWS}}', listRows)
  .replace('{{DETAIL_ARTICLES}}', detailArticles);

fs.writeFileSync(OUTPUT, output, 'utf8');
console.log(`Built ${files.length} entries → index.html`);

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
