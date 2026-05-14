class DriverPayoutAccount {
  final String? id;
  final String accountName;
  final String accountNumber;
  final String? bankCode;
  final String? provider;

  const DriverPayoutAccount({
    this.id,
    required this.accountName,
    required this.accountNumber,
    this.bankCode,
    this.provider,
  });

  factory DriverPayoutAccount.fromJson(Map<String, dynamic> json) {
    return DriverPayoutAccount(
      id: json['id'] as String?,
      accountName: json['accountName'] as String? ?? '',
      accountNumber: json['accountNumber'] as String? ?? '',
      bankCode: json['bankCode'] as String?,
      provider: json['provider'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'accountName': accountName,
        'accountNumber': accountNumber,
        if (bankCode != null && bankCode!.isNotEmpty) 'bankCode': bankCode,
        if (provider != null && provider!.isNotEmpty) 'provider': provider,
      };
}
