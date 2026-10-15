/** Receipt shape is frozen so later phases can issue it. Nothing issues one today. */
export const CONTEXT_RECEIPT = {
  schemaVersion: 1,
  issued: false,
  requiredForWork: false,
  fields: ['id', 'principal', 'instructionRevisionId', 'grantVersion', 'issuedAt', 'expiresAt', 'acknowledgement'],
  reason: 'Private owner instruction revisions and scoped grants are not implemented, so no context receipt is issued. Current claim, heartbeat, checkpoint, and release routes do not require one.',
};

export function contextReceiptStatus() {
  return {
    schemaVersion: CONTEXT_RECEIPT.schemaVersion,
    issued: false,
    acknowledgement: null,
    reason: CONTEXT_RECEIPT.reason,
  };
}
