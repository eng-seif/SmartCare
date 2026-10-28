import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'store.dart';
import 'theme.dart';
import 'screens/account.dart';
import 'screens/assistant.dart';
import 'screens/basket.dart';
import 'screens/market.dart';
import 'screens/scanner.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(FathallaApp(store: Store()));
}

class FathallaApp extends StatefulWidget {
  final Store store;
  const FathallaApp({super.key, required this.store});
  @override
  State<FathallaApp> createState() => _FathallaAppState();
}

class _FathallaAppState extends State<FathallaApp> {
  int tab = 0;
  Store get s => widget.store;
  @override
  void initState() {
    super.initState();
    unawaited(s.start());
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: s,
    builder: (context, _) => MaterialApp(
      title: 'Fathalla Health',
      debugShowCheckedModeBanner: false,
      theme: appTheme(false),
      darkTheme: appTheme(true),
      themeMode: s.dark ? ThemeMode.dark : ThemeMode.light,
      locale: Locale(s.ar ? 'ar' : 'en'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: Builder(
        builder: (context) {
          final pages = <Widget>[
            MarketPage(store: s, onScan: () => setState(() => tab = 1)),
            ScannerPage(store: s),
            AssistantPage(
              key: ValueKey('assistant-${s.ar}-${s.user?.id}'),
              store: s,
            ),
            BasketPage(store: s, onAccount: () => setState(() => tab = 4)),
            AccountPage(key: ValueKey(s.user?.id), store: s),
          ];
          return Scaffold(
            appBar: AppBar(
              titleSpacing: 16,
              title: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(9),
                    child: Image.asset(
                      'assets/logo.webp',
                      width: 34,
                      height: 34,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.t('فتح الله', 'Fathalla'),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          s.t(
                            'اختيارات أذكى كل يوم',
                            'Better choices, every day',
                          ),
                          style: TextStyle(
                            fontSize: 10,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  onPressed: s.setDark,
                  icon: Icon(
                    s.dark
                        ? Icons.light_mode_outlined
                        : Icons.dark_mode_outlined,
                  ),
                  tooltip: s.t('المظهر', 'Theme'),
                ),
                TextButton(
                  onPressed: s.setLanguage,
                  child: Text(s.ar ? 'EN' : 'عربي'),
                ),
                const SizedBox(width: 4),
              ],
            ),
            body: Column(
              children: [
                if (s.loading) const LinearProgressIndicator(minHeight: 2),
                if (s.error != null)
                  MaterialBanner(
                    content: Text(
                      s.error!,
                      style: const TextStyle(fontSize: 12),
                    ),
                    actions: [
                      TextButton(
                        onPressed: s.loading
                            ? null
                            : () => s.client == null ? s.start() : s.refresh(),
                        child: Text(s.t('إعادة المحاولة', 'Retry')),
                      ),
                    ],
                  ),
                Expanded(
                  child: SafeArea(top: false, bottom: false, child: pages[tab]),
                ),
              ],
            ),
            bottomNavigationBar: NavigationBar(
              selectedIndex: tab,
              onDestinationSelected: (i) => setState(() => tab = i),
              height: 72,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.storefront_outlined),
                  label: s.t('السوق', 'Market'),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.qr_code_scanner),
                  label: s.t('امسح', 'Scan'),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: s.t('اسأل', 'Ask'),
                ),
                NavigationDestination(
                  icon: Badge(
                    isLabelVisible: s.cart.isNotEmpty,
                    label: Text(
                      '${s.cart.fold<int>(0, (n, p) => n + (p['qty'] as num).toInt())}',
                    ),
                    child: const Icon(Icons.shopping_basket_outlined),
                  ),
                  label: s.t('السلة', 'Basket'),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.person_outline),
                  label: s.t('حسابي', 'Account'),
                ),
              ],
            ),
          );
        },
      ),
    ),
  );
}
