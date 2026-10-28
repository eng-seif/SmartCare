import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fathalla_health/main.dart';
import 'package:fathalla_health/store.dart';
import 'package:fathalla_health/widgets.dart';

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
  test('Product image URLs resolve against the published website safely', () {
    expect(
      productImageUri('/products/eggs.webp', base: 'https://shop.example'),
      Uri.parse('https://shop.example/products/eggs.webp'),
    );
    expect(
      productImageUri('images/eggs.jpg', base: 'https://shop.example/'),
      Uri.parse('https://shop.example/images/eggs.jpg'),
    );
    expect(
      productImageUri('https://cdn.example/eggs.jpg'),
      Uri.parse('https://cdn.example/eggs.jpg'),
    );
    expect(productImageUri(''), isNull);
    expect(productImageUri('file:///local/image.jpg'), isNull);
    expect(productImageUri('/image.jpg', base: ''), isNull);
  });

  testWidgets('Market card image fills the card width without stretching', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final store = PreviewStore();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: ProductTile(
              store: store,
              product: {
                'id': 'product-image-test',
                'title': 'Boiled Eggs',
                'image_url': 'https://example.com/eggs.jpg',
                'price': 8,
              },
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    final image = tester.widget<Image>(find.byType(Image));
    expect(image.fit, BoxFit.cover);
    expect(
      tester.getSize(find.byType(AspectRatio)).width,
      tester.getSize(find.byType(InkWell).first).width,
    );
    expect(find.byIcon(Icons.inventory_2_outlined), findsOneWidget);
  });

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
