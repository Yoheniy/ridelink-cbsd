import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../models/driver_payout.dart';
import '../providers/payout_provider.dart';

class DriverPayoutsScreen extends StatefulWidget {
  const DriverPayoutsScreen({super.key});

  @override
  State<DriverPayoutsScreen> createState() => _DriverPayoutsScreenState();
}

class _DriverPayoutsScreenState extends State<DriverPayoutsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PayoutProvider>().loadPayouts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PayoutProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver payouts'),
        actions: [
          IconButton(
            onPressed: () => context.push('/driver/payouts/account'),
            icon: const Icon(Icons.account_balance_outlined),
          ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : provider.payouts.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.wallet_outlined, size: 56),
                        const SizedBox(height: 12),
                        const Text('No payouts yet'),
                        const SizedBox(height: 8),
                        AppButton(
                          text: 'Set payout account',
                          onPressed: () =>
                              context.push('/driver/payouts/account'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => context.read<PayoutProvider>().loadPayouts(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.payouts.length,
                    itemBuilder: (context, index) {
                      final payout = provider.payouts[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: AppCard(
                          child: _PayoutCard(payout: payout),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _PayoutCard extends StatelessWidget {
  final DriverPayout payout;

  const _PayoutCard({required this.payout});

  @override
  Widget build(BuildContext context) {
    final color = switch (payout.status) {
      'completed' => AppColors.success,
      'processing' => AppColors.warning,
      'failed' => AppColors.error,
      _ => AppColors.primary,
    };
    final created = payout.createdAt != null
        ? DateFormat('MMM d, yyyy').format(payout.createdAt!)
        : '--';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '${payout.amount.toStringAsFixed(0)} ${payout.currency}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                payout.status,
                style: TextStyle(color: color, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text('Created: $created'),
        if (payout.providerRef != null && payout.providerRef!.isNotEmpty)
          Text('Provider ref: ${payout.providerRef}'),
      ],
    );
  }
}
