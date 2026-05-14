class DriverPayout {
  final String id;
  final String paymentId;
  final double amount;
  final String currency;
  final String status;
  final String? providerRef;
  final DateTime? processedAt;
  final DateTime? createdAt;

  const DriverPayout({
    required this.id,
    required this.paymentId,
    required this.amount,
    required this.currency,
    required this.status,
    this.providerRef,
    this.processedAt,
    this.createdAt,
  });

  factory DriverPayout.fromJson(Map<String, dynamic> json) {
    return DriverPayout(
      id: json['id'] as String? ?? '',
      paymentId: json['paymentId'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      status: json['status'] as String? ?? 'pending',
      providerRef: json['providerRef'] as String?,
      processedAt: json['processedAt'] != null
          ? DateTime.tryParse(json['processedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
