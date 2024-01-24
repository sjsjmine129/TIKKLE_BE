class ExpectedError extends Error {
  constructor({ status, message, detail_code }) {
    super(message);
    this.status = status;
    this.detail_code = detail_code;
  }
}

module.exports = { ExpectedError };
