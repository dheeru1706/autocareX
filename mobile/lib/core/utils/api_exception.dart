class ApiException implements Exception {
  final String message;
  final int statusCode;
  final dynamic data;

  const ApiException({
    required this.message,
    required this.statusCode,
    this.data,
  });

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode >= 500;
  bool get isNetworkError => statusCode == 503 || statusCode == 408;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
