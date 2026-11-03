// Verify the built SPA and infrastructure fallbacks without touching application records.
const assert = require('node:assert/strict');
const app = require('../build/src/app');
const { sequelize } = require('../build/db/models');
async function run() {
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${app.address().port}`;
  try {
    for (const path of [
      '/',
      '/listings',
      '/listings/1',
      '/listings/new',
      '/about',
      '/sign-in',
      '/sign-up',
      '/profile',
      '/profile/edit',
      '/messages',
      '/messages/2',
      '/unknown',
      '/unknown.html',
      '/advert/1',
    ]) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.text()).includes('id="root"'), path);
    }
    for (const path of ['/api/unknown', '/images/unknown.webp']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 404, path);
      assert.ok(!(await response.text()).includes('id="root"'), path);
    }
    assert.equal((await fetch(origin + '/ws')).status, 426);
    console.log(
      'PASS: all canonical routes and unknown paths receive the built SPA; API/images/ws retain infrastructure responses',
    );
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await sequelize.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
