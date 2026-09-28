/** PENDING → the requester can still cancel it (`stock.request_transfer`,
 * "if no action has been taken"). From PENDING, whoever has
 * `stock.approve_transfer` at the receiving side either APPROVES it (moves
 * stock immediately, permanent) or REJECTS it (no stock movement,
 * permanent). CANCELLED is the requester's own withdrawal, also only from
 * PENDING. */
export enum StockTransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
