export class NetworkError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.data = data;
  }
}
