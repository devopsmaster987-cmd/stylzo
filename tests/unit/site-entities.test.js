import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { site, ids } from '../../config/site.js';
import { TOPIC_CLUSTERS } from '../../lib/topic-clusters.js';

const appKeys = [
  'generator', 'text-tools', 'qr-code-generator', 'qr-code-reader',
  'image-compression', 'universal-text-fixer', 'screenshot-to-text',
  'pdf-editor', 'pdf-accessibility-checker', 'studio',
];

describe('site entities', () => {
  test('every entity has one stable id', () => {
    assert.match(ids.organization, /#organization$/);
    assert.match(ids.website, /#website$/);
    assert.match(ids.owner, /#owner$/);
    assert.equal(ids.page('/'), `${new URL(ids.website).origin}/#webpage`);
    assert.equal(ids.page('/tools'), `${new URL(ids.website).origin}/tools#webpage`);
    assert.notEqual(ids.page('/tools'), ids.page('/about'));
    const appIds = appKeys.map((key) => ids.app(key));
    assert.equal(new Set(appIds).size, appIds.length, 'two WebApplications share an @id');
    assert.throws(() => ids.app('not-an-app'), /Unknown WebApplication/);
  });

  test('the owner is a real person and the email is not a placeholder', () => {
    assert.ok(site.ownerName.trim().length > 3, 'owner name is empty');
    assert.doesNotMatch(site.ownerName, /todo|placeholder|example|owner/i);
    assert.match(site.businessEmail, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    assert.doesNotMatch(site.businessEmail, /example\.(com|org)|todo|placeholder/i);
    assert.equal(site.alternateName, 'abdulsamad.shop');
  });

  test('the generator and every tool have a complete WebApplication definition', () => {
    assert.deepEqual(Object.keys(site.apps).sort(), [...appKeys].sort());
    const names = new Set();
    for (const key of appKeys) {
      const app = site.apps[key];
      assert.match(app.name, /^Stylzo /, `${key} does not use the Stylzo brand`);
      assert.ok(!names.has(app.name), `${key} reuses the name ${app.name}`);
      names.add(app.name);
      assert.ok(app.path.startsWith('/'), `${key} has no path`);
      assert.ok(app.description.length > 80, `${key} has a thin description`);
      assert.ok(app.applicationCategory.length > 3, `${key} has no category`);
      assert.ok(app.applicationSubCategory.length > 3, `${key} has no subcategory`);
      if (key === 'generator') {
        assert.equal(app.features, null, 'generator features must come from facts.js');
      } else {
        assert.ok(app.features.length >= 3, `${key} has a thin feature list`);
      }
    }
  });

  test('the four topic clusters have one owner and real members', () => {
    assert.deepEqual(
      TOPIC_CLUSTERS.map((cluster) => cluster.key).sort(),
      ['libraries', 'platform-guides', 'text-tools', 'unicode-text-styles'],
    );
    const keys = new Set();
    for (const cluster of TOPIC_CLUSTERS) {
      assert.ok(!keys.has(cluster.key), `${cluster.key} is defined twice`);
      keys.add(cluster.key);
      assert.ok(cluster.term.length > 5, `${cluster.key} has no defining term`);
      assert.ok(cluster.owner.startsWith('/'), `${cluster.key} has no owner path`);
      assert.ok(cluster.members.length >= 2, `${cluster.key} has no cluster`);
      assert.ok(!cluster.members.includes(cluster.owner), `${cluster.key} owns and joins itself`);
      for (const member of cluster.members) {
        assert.ok(member.startsWith('/'), `${cluster.key} has a bad member ${member}`);
      }
    }
  });
});
