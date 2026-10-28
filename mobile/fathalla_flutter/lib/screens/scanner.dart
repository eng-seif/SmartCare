import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../store.dart';
import '../widgets.dart';

class ScannerPage extends StatefulWidget {
  final Store store;
  const ScannerPage({super.key, required this.store});
  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> with WidgetsBindingObserver {
  final camera = MobileScannerController();
  final barcode = TextEditingController();
  bool busy = false, disposed = false;
  Store get s => widget.store;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    disposed = true;
    WidgetsBinding.instance.removeObserver(this);
    camera.dispose();
    barcode.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      camera.stop();
    }
    if (state == AppLifecycleState.resumed && !busy && !disposed) {
      camera.start();
    }
  }

  Future<void> lookup(String code) async {
    if (busy || code.trim().isEmpty) return;
    setState(() => busy = true);
    try {
      await camera.stop();
      if (s.client == null) {
        throw ApiFailure(
          s.t(
            'الاتصال بالكتالوج غير متاح بعد.',
            'Catalog connection is not available yet.',
          ),
        );
      }
      final p = await s.client!
          .from('products')
          .select()
          .eq('barcode', code.trim())
          .maybeSingle();
      if (!mounted) return;
      if (p == null) {
        notify(
          context,
          s.t(
            'الباركود غير موجود في الكتالوج.',
            'Barcode not found in the catalog.',
          ),
        );
      } else {
        await showProduct(context, s, p);
      }
    } catch (e) {
      if (mounted) notify(context, s.message(e));
    } finally {
      if (mounted) {
        setState(() => busy = false);
        try {
          await camera.start();
        } catch (_) {
          /* Manual entry remains available. */
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Text(
        s.t('امسح المنتج', 'Scan a product'),
        style: const TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: 8),
      Text(
        s.t(
          'وجّه الكاميرا للباركود، أو اكتب رقمه بالأسفل.',
          'Point the camera at a barcode, or enter its number below.',
        ),
      ),
      const SizedBox(height: 20),
      ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 260,
          child: MobileScanner(
            controller: camera,
            errorBuilder: (_, __, ___) => Center(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Text(
                  s.t(
                    'الكاميرا غير متاحة. اسمح باستخدامها من إعدادات الهاتف أو أدخل الباركود يدويًا.',
                    'Camera unavailable. Allow camera access in phone settings or enter a barcode manually.',
                  ),
                ),
              ),
            ),
            onDetect: (capture) {
              for (final code in capture.barcodes) {
                if (code.rawValue?.isNotEmpty == true) {
                  lookup(code.rawValue!);
                  break;
                }
              }
            },
          ),
        ),
      ),
      const SizedBox(height: 18),
      TextField(
        controller: barcode,
        keyboardType: TextInputType.number,
        textDirection: TextDirection.ltr,
        decoration: InputDecoration(
          labelText: s.t('رقم الباركود', 'Barcode number'),
        ),
        onSubmitted: lookup,
      ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: busy ? null : () => lookup(barcode.text),
        icon: const Icon(Icons.search),
        label: Text(
          busy
              ? s.t('جارٍ البحث…', 'Looking up…')
              : s.t('ابحث عن المنتج', 'Find product'),
        ),
      ),
    ],
  );
}
