import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthHeader } from '../src/services/auth-header.js';

test('getAuthHeader awaits Supabase session and returns bearer token', async () => {
  const auth = {
    async getSession() {
      return { data: { session: { access_token: 'test-token' } } };
    },
  };

  await assert.doesNotReject(async () => {
    assert.equal(await getAuthHeader(auth), 'Bearer test-token');
  });
});

test('getAuthHeader returns null when no session is available', async () => {
  const auth = {
    async getSession() {
      return { data: { session: null } };
    },
  };

  assert.equal(await getAuthHeader(auth), null);
});
