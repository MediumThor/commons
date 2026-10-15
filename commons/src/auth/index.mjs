export {
  ALLOWED_AGENT_SCOPES,
  FORBIDDEN_AGENT_SCOPES,
  DEFAULT_AGENT_SCOPES,
  validateAgentScopes,
  assertNotAgentRequest,
  resolveHumanPrincipal,
  resolveAgentPrincipal,
} from './principals.mjs';

export {
  loadFirebaseEmulatorConfig,
  createEmulatorIdToken,
  verifyEmulatorIdToken,
  evaluateFirestoreSecurityRules,
  createFirestoreEmulatorGuard,
} from './firebase-emulator.mjs';
