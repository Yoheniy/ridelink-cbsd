import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../models/driver_payout_account.dart';
import '../providers/payout_provider.dart';

class PayoutAccountScreen extends StatefulWidget {
  const PayoutAccountScreen({super.key});

  @override
  State<PayoutAccountScreen> createState() => _PayoutAccountScreenState();
}

class _PayoutAccountScreenState extends State<PayoutAccountScreen> {
  final _accountNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _bankCodeController = TextEditingController();
  final _providerController = TextEditingController();

  @override
  void dispose() {
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _bankCodeController.dispose();
    _providerController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final accountName = _accountNameController.text.trim();
    final accountNumber = _accountNumberController.text.trim();
    if (accountName.length < 2 || accountNumber.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide valid payout details')),
      );
      return;
    }

    final payload = DriverPayoutAccount(
      accountName: accountName,
      accountNumber: accountNumber,
      bankCode: _bankCodeController.text.trim(),
      provider: _providerController.text.trim(),
    );
    final ok = await context.read<PayoutProvider>().upsertAccount(payload);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text(ok ? 'Payout account saved' : 'Failed to save payout account'),
      ),
    );
    if (ok) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PayoutProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Payout account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            AppTextField(
              controller: _accountNameController,
              hintText: 'Account name',
              prefixIcon: Icons.person_outline,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _accountNumberController,
              hintText: 'Account number',
              prefixIcon: Icons.numbers_outlined,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _bankCodeController,
              hintText: 'Bank code (optional)',
              prefixIcon: Icons.account_balance_outlined,
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _providerController,
              hintText: 'Provider (optional)',
              prefixIcon: Icons.account_balance_wallet_outlined,
            ),
            const SizedBox(height: 20),
            AppButton(
              text: 'Save account',
              onPressed: provider.saving ? null : _save,
              isLoading: provider.saving,
            ),
          ],
        ),
      ),
    );
  }
}
