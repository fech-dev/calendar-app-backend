export class EventOverlapError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'EventOverlapError';
  }
}
