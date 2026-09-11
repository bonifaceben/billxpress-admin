import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sliderPayload } from './sliderPayload.js';

const original = { title: 'Promo', imageUrl: 'https://example.com/banner.webp', linkUrl: '/services/data', isActive: true, sortOrder: 1 };

test('creation sends the uploaded image without a competing URL', () => {
  const payload = sliderPayload(original, null, 'data:image/webp;base64,AAAA');
  assert.equal(payload.imageBase64, 'data:image/webp;base64,AAAA');
  assert.equal(payload.imageUrl, undefined);
  assert.equal(payload.isActive, true);
});

test('unchanged edit has no fields; link clearing and deactivation stay explicit', () => {
  assert.deepEqual(sliderPayload(original, original), {});
  assert.deepEqual(sliderPayload({ ...original, linkUrl: '', isActive: false }, original), { linkUrl: '', isActive: false });
});

test('replacing an image sends only the chosen image source', () => {
  assert.deepEqual(sliderPayload(original, original, 'data:image/png;base64,AAAA'), { imageBase64: 'data:image/png;base64,AAAA' });
  assert.deepEqual(sliderPayload({ ...original, imageUrl: 'https://example.com/new.png' }, original), { imageUrl: 'https://example.com/new.png' });
});

test('sort order becomes a number and invalid order or missing images are rejected', () => {
  assert.deepEqual(sliderPayload({ ...original, sortOrder: '0' }, original), { sortOrder: 0 });
  assert.throws(() => sliderPayload({ ...original, sortOrder: '1.5' }, original));
  assert.throws(() => sliderPayload({ ...original, imageUrl: '' }, null));
  assert.throws(() => sliderPayload({ ...original, imageUrl: 'javascript:alert(1)' }, null));
});
