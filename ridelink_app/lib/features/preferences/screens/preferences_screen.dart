import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/user_preference_model.dart';
import '../providers/user_preference_provider.dart';
import '../widgets/preference_form.dart';

class PreferencesScreen extends StatefulWidget {
  final bool fromRegister;

  const PreferencesScreen({super.key, this.fromRegister = false});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserPreferenceProvider>().loadFromMe();
    });
  }

  Future<void> _save(UserPreferenceModel preference) async {
    final auth = context.read<AuthProvider>();
    final prefProvider = context.read<UserPreferenceProvider>();
    final user = auth.user;
    if (user == null) return;

    final phone = (user.phone).trim();
    final nationalId = (user.nationalId).trim();
    if (phone.isEmpty || nationalId.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Complete profile with phone and national ID before saving preferences.',
          ),
        ),
      );
      return;
    }

    final ok = await prefProvider.savePreference(
      preference: preference,
      phone: phone,
      nationalId: nationalId,
    );
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Commute preferences saved')),
      );
      if (widget.fromRegister) {
        context.go('/login');
      } else {
        context.pop();
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(prefProvider.error ?? 'Failed to save preferences'),
        ),
      );
    }
  }

  void _skip() {
    if (widget.fromRegister) {
      context.go('/login');
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UserPreferenceProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commute preferences'),
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: PreferenceForm(
                initialPreference: provider.preference,
                onSubmit: _save,
                onSkip: _skip,
                saving: provider.saving,
              ),
            ),
    );
  }
}
