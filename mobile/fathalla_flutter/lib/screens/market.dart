import 'package:flutter/material.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets.dart';
import 'assistant.dart';

class MarketPage extends StatefulWidget {
  final Store store;
  final VoidCallback onScan;
  const MarketPage({super.key, required this.store, required this.onScan});
  @override
  State<MarketPage> createState() => _MarketPageState();
}

class _MarketPageState extends State<MarketPage> {
  String query = '', category = '';
  bool screening = false;
  @override
  Widget build(BuildContext context) {
    final s = widget.store;
    final categories = s.products
        .map((p) => p['category']?.toString() ?? '')
        .where((c) => c.isNotEmpty && c.toLowerCase() != 'pantry' && c != 'مؤن')
        .toSet();
    final filtered = s.products
        .where(
          (p) =>
              (category.isEmpty || p['category'] == category) &&
              '${p['title']} ${p['category']}'.toLowerCase().contains(
                query.toLowerCase().trim(),
              ) &&
              (!screening || evaluateProduct(p, s).level == 0),
        )
        .toList();
    return RefreshIndicator(
      onRefresh: s.client == null ? s.start : s.refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: charcoal,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.t('✦ تسوّق على طريقتك', 'Your everyday food guide'),
                  style: const TextStyle(
                    color: sand,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  s.t(
                    'كل معلومة تساعدك تختار.',
                    'Clearer labels. Better choices.',
                  ),
                  style: const TextStyle(
                    color: warmWhite,
                    fontSize: 25,
                    height: 1.4,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  s.t(
                    'اكتشف المنتجات وافهم الملاحظات ببساطة.',
                    'Explore foods and understand what deserves a closer look.',
                  ),
                  style: const TextStyle(
                    color: Color(0xFFE6D9C4),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: widget.onScan,
                  icon: const Icon(Icons.qr_code_scanner, size: 18),
                  label: Text(s.t('امسح باركود', 'Scan a barcode')),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => showModalBottomSheet<void>(
                    context: context,
                    useSafeArea: true,
                    isScrollControlled: true,
                    builder: (context) => Padding(
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            s.t('كيف يعمل الفحص؟', 'How screening works'),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            s.t(
                              'نفحص بيانات الملصق لكل حصة. بعد تسجيل الدخول، اختَر حالتك وحدودك من حسابي لتخصيص الملاحظات. القيم الناقصة تُعرض كغير متاحة، والفحص ليس بديلًا للطبيب.',
                              'We screen per-serving labels. Sign in and edit your account profile to set conditions and intake limits. Missing values remain unknown. Screening is not a substitute for your clinician.',
                            ),
                          ),
                          const SizedBox(height: 18),
                          FilledButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text(s.t('فهمت', 'Got it')),
                          ),
                        ],
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.monitor_heart_outlined, size: 18),
                  label: Text(s.t('خيارات الفحص', 'Screening')),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AssistantCard(
            key: ValueKey('home-chat-${s.ar}-${s.user?.id}'),
            store: s,
          ),
          const SizedBox(height: 22),
          Text(
            s.t('اختيارات من السوق', 'Explore the market'),
            style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 5),
          Text(
            s.t(
              'افهم سبب الملاحظة قبل أن تقرر.',
              'See what prompted a note, then decide.',
            ),
            style: const TextStyle(fontSize: 12),
          ),
          const SizedBox(height: 12),
          TextField(
            onChanged: (v) => setState(() => query = v),
            decoration: InputDecoration(
              hintText: s.t('ابحث عن منتج', 'Search products'),
              prefixIcon: const Icon(Icons.search),
            ),
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: Text(
              s.t('اعرض الخيارات الأقل تأثيرًا', 'Show lower-flag choices'),
              style: const TextStyle(fontSize: 12),
            ),
            value: screening,
            onChanged: (v) => setState(() => screening = v),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final c in ['', ...categories])
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 7),
                    child: ChoiceChip(
                      label: Text(
                        c.isEmpty ? s.t('الكل', 'All') : c,
                        style: const TextStyle(fontSize: 11),
                      ),
                      selected: c == category,
                      showCheckmark: false,
                      onSelected: (_) => setState(() => category = c),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ...filtered.map(
            (p) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ProductTile(product: p, store: s),
            ),
          ),
          if (filtered.isEmpty && !s.loading)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 28),
              child: Text(
                s.t(
                  'لا توجد منتجات مطابقة حاليًا. لم نستخدم أمثلة بدلًا من الكتالوج.',
                  'No matching products available. No sample catalog has been substituted.',
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}
