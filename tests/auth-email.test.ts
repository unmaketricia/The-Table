import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanEmail, cooldownSeconds, emailChangeComplete, emailCooldownKey, validEmail} from '../lib/auth-email.ts';
test('email change completes only after both verifications remove the pending address', () => {
  assert.equal(emailChangeComplete('old@example.com', 'new@example.com', 'old@example.com', 'new@example.com'), false);
  assert.equal(emailChangeComplete('new@example.com', 'new@example.com', 'old@example.com', 'new@example.com'), false);
  assert.equal(emailChangeComplete('old@example.com', undefined, 'old@example.com', 'new@example.com'), false);
  assert.equal(emailChangeComplete('unrelated@example.com', undefined, 'old@example.com', 'new@example.com'), false);
  assert.equal(emailChangeComplete('new@example.com', undefined, 'old@example.com', 'new@example.com'), true);
});
test('cooldown uses an absolute deadline so reloads and inactive tabs cannot skip the wait', () => {
  const sentAt = 100_000, deadline = sentAt + 60_000;
  assert.equal(cooldownSeconds(deadline, sentAt), 60);
  assert.equal(cooldownSeconds(deadline, sentAt + 59_999), 1);
  assert.equal(cooldownSeconds(deadline, sentAt + 60_000), 0);
  assert.equal(cooldownSeconds(deadline, sentAt + 90_000), 0);
});
test('verification and reset cooldowns normalize the address and stay independent', () => {
  assert.equal(emailCooldownKey('signup', ' Person@Example.COM '), emailCooldownKey('signup', 'person@example.com'));
  assert.notEqual(emailCooldownKey('signup', 'person@example.com'), emailCooldownKey('reset', 'person@example.com'));
  assert.equal(cleanEmail(' NEW@example.com '), 'new@example.com');
  assert.equal(validEmail('not an email'), false);
});
