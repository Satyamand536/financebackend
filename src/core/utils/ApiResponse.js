class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(message, data = null, statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static error(message, statusCode = 500) {
    return new ApiResponse(statusCode, null, message);
  }
}

module.exports = ApiResponse;
