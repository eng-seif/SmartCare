import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fathalla_health/main.dart';
import 'package:fathalla_health/store.dart';

class PreviewStore extends Store {
  @override
  Future<void> start() async {
    ready = true;
  }

  @override
  Future<void> setLanguage() async {
    ar = !ar;
    notifyListeners();
  }

  @override
  Future<void> setDark() async {
    dark = !dark;
    notifyListeners();
  }
}

void main() {
  testWidgets(
    'Arabic market, theme, language, guest basket and account remain navigable',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final store = PreviewStore();
      await tester.pumpWidget(FathallaApp(store: store));
      await tester.pumpAndSettle();
      expect(find.text('كل معلومة تساعدك تختار.'), findsOneWidget);
      await tester.tap(find.byTooltip('المظهر'));
      await tester.pumpAndSettle();
      expect(store.dark, true);
      await tester.tap(find.text('EN'));
      await tester.pumpAndSettle();
      expect(find.text('Clearer labels. Better choices.'), findsOneWidget);
      await tester.tap(find.text('Basket'));
      await tester.pumpAndSettle();
      expect(
        find.text('Sign in to save and sync your basket with the website.'),
        findsOneWidget,
      );
      await tester.tap(find.text('Account'));
      await tester.pumpAndSettle();
      expect(find.text('Welcome back'), findsOneWidget);
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();
      expect(find.text('Enter a valid email.'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
