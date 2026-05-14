import 'package:flutter/material.dart';

import '../../../core/services/gebeta_maps_service.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/location_search_field.dart';
import '../models/user_preference_model.dart';

class PreferenceForm extends StatefulWidget {
  final UserPreferenceModel? initialPreference;
  final void Function(UserPreferenceModel preference) onSubmit;
  final VoidCallback? onSkip;
  final bool saving;

  const PreferenceForm({
    super.key,
    required this.onSubmit,
    this.initialPreference,
    this.onSkip,
    this.saving = false,
  });

  @override
  State<PreferenceForm> createState() => _PreferenceFormState();
}

class _PreferenceFormState extends State<PreferenceForm> {
  final _maxPriceController = TextEditingController();
  GeocodingResult? _origin;
  GeocodingResult? _destination;
  TimeOfDay? _preferredTime;

  @override
  void initState() {
    super.initState();
    final pref = widget.initialPreference;
    if (pref != null) {
      _origin = GeocodingResult(
        name: pref.origin.label ?? '',
        lat: pref.origin.lat,
        lng: pref.origin.lng,
      );
      _destination = GeocodingResult(
        name: pref.destination.label ?? '',
        lat: pref.destination.lat,
        lng: pref.destination.lng,
      );
      _maxPriceController.text =
          pref.maxPrice != null ? pref.maxPrice!.toStringAsFixed(0) : '';
      if (pref.preferredTime != null && pref.preferredTime!.contains(':')) {
        final parts = pref.preferredTime!.split(':');
        final h = int.tryParse(parts.first) ?? 8;
        final m = int.tryParse(parts.last) ?? 0;
        _preferredTime = TimeOfDay(hour: h, minute: m);
      }
    }
  }

  @override
  void dispose() {
    _maxPriceController.dispose();
    super.dispose();
  }

  Future<void> _pickTime() async {
    final selected = await showTimePicker(
      context: context,
      initialTime: _preferredTime ?? const TimeOfDay(hour: 8, minute: 0),
    );
    if (selected != null) {
      setState(() => _preferredTime = selected);
    }
  }

  void _submit() {
    if (_origin == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select origin and destination')),
      );
      return;
    }
    final maxPrice = double.tryParse(_maxPriceController.text.trim());
    final pref = UserPreferenceModel(
      origin: PreferenceLocation(
        lat: _origin!.lat,
        lng: _origin!.lng,
        label: _origin!.name,
      ),
      destination: PreferenceLocation(
        lat: _destination!.lat,
        lng: _destination!.lng,
        label: _destination!.name,
      ),
      preferredTime: _preferredTime == null
          ? null
          : '${_preferredTime!.hour.toString().padLeft(2, '0')}:${_preferredTime!.minute.toString().padLeft(2, '0')}',
      maxPrice: maxPrice,
    );
    widget.onSubmit(pref);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LocationSearchField(
          hintText: 'Preferred origin',
          prefixIcon: Icons.trip_origin,
          initialValue: _origin?.name,
          onPlaceSelected: (r) => setState(() => _origin = r),
        ),
        const SizedBox(height: 12),
        LocationSearchField(
          hintText: 'Preferred destination',
          prefixIcon: Icons.location_on_outlined,
          initialValue: _destination?.name,
          onPlaceSelected: (r) => setState(() => _destination = r),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _pickTime,
          icon: const Icon(Icons.access_time),
          label: Text(
            _preferredTime == null
                ? 'Preferred departure time'
                : 'Preferred time: ${_preferredTime!.hour.toString().padLeft(2, '0')}:${_preferredTime!.minute.toString().padLeft(2, '0')}',
          ),
        ),
        const SizedBox(height: 12),
        AppTextField(
          controller: _maxPriceController,
          hintText: 'Max price per seat (ETB)',
          prefixIcon: Icons.payments_outlined,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: widget.saving ? null : _submit,
          child: widget.saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save preferences'),
        ),
        if (widget.onSkip != null) ...[
          const SizedBox(height: 8),
          TextButton(
            onPressed: widget.saving ? null : widget.onSkip,
            child: const Text('Skip for now'),
          ),
        ],
      ],
    );
  }
}
