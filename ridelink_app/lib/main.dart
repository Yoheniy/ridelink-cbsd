import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'core/constants/app_constants.dart';
import 'core/network/api_client.dart';
import 'core/services/chapa_service.dart';
import 'core/services/gebeta_maps_service.dart';
import 'core/services/place_search_storage.dart';
import 'core/services/storage_service.dart';
import 'core/services/locale_provider.dart';
import 'core/services/location_service.dart';
import 'core/theme/theme_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/repositories/auth_repository.dart';
import 'features/auth/repositories/in_memory_auth_repository.dart';
import 'features/chat/providers/chat_provider.dart';
import 'features/driver/trip/providers/trip_provider.dart';
import 'features/driver/trip/providers/trip_series_provider.dart';
import 'features/emergency/providers/emergency_provider.dart';
import 'features/feedback/providers/feedback_provider.dart';
import 'features/feedback/repositories/feedback_repository.dart';
import 'features/notifications/providers/notification_provider.dart';
import 'features/passenger/booking/providers/booking_provider.dart';
import 'features/passenger/search/providers/search_provider.dart';
import 'features/payment/providers/payment_provider.dart';
import 'features/payment/providers/payout_provider.dart';
import 'features/payment/repositories/payout_repository.dart';
import 'features/preferences/providers/user_preference_provider.dart';
import 'features/preferences/repositories/user_preference_repository.dart';
import 'features/tracking/providers/tracking_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storageService = StorageService();
  final apiClient = ApiClient(storageService);
  final locationService = LocationService();
  final gebetaMapsService = GebetaMapsService();
  final placeSearchStorage = PlaceSearchStorage();
  final chapaService = ChapaService();

  final feedbackRepository = ApiFeedbackRepository(apiClient);
  final userPreferenceRepository = ApiUserPreferenceRepository(apiClient);
  final payoutRepository = ApiPayoutRepository(apiClient);
  final useInMemoryAuthSimulation =
      const bool.fromEnvironment('USE_IN_MEMORY_AUTH_SIMULATION');
  final authRepository = useInMemoryAuthSimulation
      ? InMemoryAuthRepository()
      : ApiAuthRepository(apiClient);

  ConvexClient? convex;
  final isConvexConfigured =
      !AppConstants.convexUrl.contains('your-convex-deployment');
  if (isConvexConfigured) {
    await ConvexClient.initialize(
      ConvexConfig(
        deploymentUrl: AppConstants.convexUrl,
        clientId: 'ridelink-flutter',
        operationTimeout: const Duration(seconds: 30),
      ),
    );
    convex = ConvexClient.instance;
  }

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: apiClient),
        Provider.value(value: storageService),
        Provider.value(value: locationService),
        Provider.value(value: gebetaMapsService),
        Provider.value(value: placeSearchStorage),
        Provider.value(value: chapaService),
        Provider<ConvexClient?>.value(value: convex),

        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LocaleProvider(storageService)),

        ChangeNotifierProvider(
          create: (_) =>
              AuthProvider(authRepository, storageService, convex: convex),
        ),

        ChangeNotifierProvider(
          create: (_) => TrackingProvider(convex, locationService),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ChatProvider>(
          create: (_) => ChatProvider(convex, ''),
          update: (_, auth, chatProvider) {
            final provider = chatProvider ?? ChatProvider(convex, '');
            provider.bindAuthSync(auth.ensureConvexAuth);
            final userId = auth.user?.id;
            if (userId != null && userId.isNotEmpty) {
              provider.setUserId(userId);
            }
            return provider;
          },
        ),
        ChangeNotifierProvider(
          create: (_) => NotificationProvider(convex, ''),
        ),

        ChangeNotifierProvider(
            create: (_) => TripProvider(apiClient, storageService)),
        ChangeNotifierProvider(
          create: (_) => SearchProvider(apiClient, gebetaMapsService),
        ),
        ChangeNotifierProvider(
          create: (_) =>
              UserPreferenceProvider(userPreferenceRepository),
        ),
        ChangeNotifierProvider(
            create: (_) => BookingProvider(apiClient, storageService)),
        ChangeNotifierProvider(
            create: (_) =>
                TripSeriesProvider(apiClient, storageService)),

        ChangeNotifierProvider(
          create: (_) => PaymentProvider(chapaService, apiClient),
        ),
        ChangeNotifierProvider(
          create: (_) => PayoutProvider(payoutRepository),
        ),

        ChangeNotifierProvider(
          create: (_) => EmergencyProvider(convex, locationService),
        ),
        ChangeNotifierProvider(
            create: (_) => FeedbackProvider(feedbackRepository)),
      ],
      child: const RideLinkApp(),
    ),
  );
}
