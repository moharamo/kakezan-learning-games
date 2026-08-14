import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('entry page loads the app module and responsive viewport', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /name="viewport"/);
  assert.match(html, /src="\/src\/main\.js"/);
  assert.match(html, /lang="ja"/);
});

