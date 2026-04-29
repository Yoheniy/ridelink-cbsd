
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ridelink/core/widgets/shell_drawer_scope.dart';

AppBar passengerAppBar(BuildContext context, String title) {
 
    return AppBar(
      leading:  ShellMenuButton(
        color: Colors.white,
      ),
      title: Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)),
      centerTitle: true,
      backgroundColor: Theme.of(context).colorScheme.primaryFixedDim,
      actions: [
        IconButton(
          icon: Icon(Icons.notifications_rounded,
          color: Colors.white,
          ),
          tooltip: 'Notifications',
          onPressed: () => context.push('/notifications'),
        ),
      ],
    );
  
}