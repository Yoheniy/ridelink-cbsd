class PreferenceLocation {
  final double lat;
  final double lng;
  final String? label;

  const PreferenceLocation({
    required this.lat,
    required this.lng,
    this.label,
  });

  factory PreferenceLocation.fromJson(Map<String, dynamic> json) {
    return PreferenceLocation(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      label: json['label'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'lat': lat,
        'lng': lng,
        if (label != null && label!.isNotEmpty) 'label': label,
      };
}

class UserPreferenceModel {
  final PreferenceLocation origin;
  final PreferenceLocation destination;
  final String? preferredTime;
  final double? maxPrice;
  final bool? isActive;

  const UserPreferenceModel({
    required this.origin,
    required this.destination,
    this.preferredTime,
    this.maxPrice,
    this.isActive,
  });

  factory UserPreferenceModel.fromJson(Map<String, dynamic> json) {
    return UserPreferenceModel(
      origin: PreferenceLocation.fromJson(
        json['origin'] as Map<String, dynamic>,
      ),
      destination: PreferenceLocation.fromJson(
        json['destination'] as Map<String, dynamic>,
      ),
      preferredTime: json['preferredTime'] as String?,
      maxPrice: (json['maxPrice'] as num?)?.toDouble(),
      isActive: json['isActive'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
        'origin': origin.toJson(),
        'destination': destination.toJson(),
        if (preferredTime != null && preferredTime!.isNotEmpty)
          'preferredTime': preferredTime,
        if (maxPrice != null) 'maxPrice': maxPrice,
        if (isActive != null) 'isActive': isActive,
      };
}
