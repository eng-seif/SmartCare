import 'package:flutter/material.dart';

const charcoal = Color(0xFF252525);
const sand = Color(0xFFD9C6A5);
const warmWhite = Color(0xFFFFFDF8);
const warmBackground = Color(0xFFF5F0E7);
const copper = Color(0xFF8F552F);

ThemeData appTheme(bool dark) {
  final scheme =
      ColorScheme.fromSeed(
        seedColor: charcoal,
        brightness: dark ? Brightness.dark : Brightness.light,
      ).copyWith(
        primary: dark ? sand : charcoal,
        onPrimary: dark ? charcoal : warmWhite,
        secondary: dark ? sand : copper,
        surface: dark ? const Color(0xFF242320) : warmWhite,
        onSurface: dark ? const Color(0xFFF7F1E7) : charcoal,
        outline: dark ? const Color(0xFF776B56) : const Color(0xFFDDD4C6),
        surfaceContainerHighest: dark
            ? const Color(0xFF353128)
            : const Color(0xFFEEE4D4),
      );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? const Color(0xFF181817) : warmBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outline.withValues(alpha: .5)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF2B2822) : warmBackground,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.outline),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(44, 46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(44, 46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: scheme.surface,
      indicatorColor: dark ? const Color(0xFF493F31) : const Color(0xFFEEE4D4),
      labelTextStyle: const WidgetStatePropertyAll(TextStyle(fontSize: 10)),
    ),
  );
}
