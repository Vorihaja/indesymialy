import assert from "node:assert/strict";
import test from "node:test";

import {
  challengeThenVerifyTotp,
  claimSubmission,
  enrollTotpOnce,
  getOrCreateTotpEnrollment,
  isCurrentUnverifiedTotpFactor,
  mfaFailureLogDetails,
  normalizeTotpCode,
  safeMfaErrorCode,
} from "./mfa-flow.ts";

test("l'enrôlement idempotent n'appelle enroll qu'une fois après un rejeu Strict Mode", async () => {
  let enrollCalls = 0;
  const enroll = async () => {
    enrollCalls += 1;
    return { factorId: "factor-current", qrCode: "data:image/svg+xml,current", secret: "private" };
  };

  const first = await getOrCreateTotpEnrollment(null, enroll);
  const second = await getOrCreateTotpEnrollment(first, enroll);

  assert.equal(enrollCalls, 1);
  assert.strictEqual(second, first);
});

test("le QR et le factorId proviennent du même résultat enroll", async () => {
  const payload = {
    id: "factor-from-enroll",
    totp: { qr_code: "data:image/svg+xml,paired", secret: "private" },
  };
  const enrollment = await enrollTotpOnce(async () => ({ data: payload, error: null }));

  assert.equal(enrollment.factorId, payload.id);
  assert.equal(enrollment.qrCode, payload.totp.qr_code);
});

test("le code reste une chaîne et conserve un zéro initial", () => {
  const code = normalizeTotpCode(" 012 345 ");

  assert.equal(code, "012345");
  assert.equal(typeof code, "string");
});

test("chaque tentative crée un nouveau challenge puis vérifie immédiatement", async () => {
  let challengeCalls = 0;
  const verified = [];
  const challenge = async (factorId) => ({
    data: { id: `challenge-${++challengeCalls}` },
    error: null,
  });
  const verify = async (params) => {
    verified.push(params);
    return { data: {}, error: null };
  };

  await challengeThenVerifyTotp("factor-current", "012345", challenge, verify);
  await challengeThenVerifyTotp("factor-current", "654321", challenge, verify);

  assert.equal(challengeCalls, 2);
  assert.deepEqual(verified.map((attempt) => attempt.challengeId), ["challenge-1", "challenge-2"]);
  assert.deepEqual(verified.map((attempt) => attempt.factorId), ["factor-current", "factor-current"]);
  assert.deepEqual(verified.map((attempt) => attempt.code), ["012345", "654321"]);
});

test("le verrou de soumission refuse une double soumission", () => {
  const lock = { current: false };

  assert.equal(claimSubmission(lock), true);
  assert.equal(claimSubmission(lock), false);
});

test("le diagnostic et les logs ne contiennent que le code sûr", () => {
  const safeCode = safeMfaErrorCode({
    code: "mfa_verification_failed",
    message: "secret=private code=012345 factor=factor-current challenge=challenge-1",
  });
  const details = mfaFailureLogDetails(safeCode, "mfa_enrollment");

  assert.deepEqual(details, {
    errorCode: "mfa_verification_failed",
    source: "mfa_enrollment",
  });
  assert.equal(JSON.stringify(details).includes("private"), false);
  assert.equal(JSON.stringify(details).includes("012345"), false);
});

test("seul le facteur TOTP courant non vérifié peut être abandonné", () => {
  assert.equal(isCurrentUnverifiedTotpFactor({
    id: "factor-current",
    factor_type: "totp",
    status: "unverified",
  }, "factor-current"), true);
  assert.equal(isCurrentUnverifiedTotpFactor({
    id: "factor-current",
    factor_type: "totp",
    status: "verified",
  }, "factor-current"), false);
});
