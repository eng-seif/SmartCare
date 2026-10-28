import 'package:flutter/material.dart' hide DataRow;
import '../health.dart';
import '../store.dart';
import '../widgets.dart';

class BasketPage extends StatelessWidget {
  final Store store;
  final VoidCallback onAccount;
  const BasketPage({super.key, required this.store, required this.onAccount});
  @override
  Widget build(BuildContext context) {
    final s = store;
    if (s.user == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shopping_basket_outlined, size: 48),
              const SizedBox(height: 15),
              Text(
                s.t(
                  'سجّل الدخول لحفظ السلة ومزامنتها مع الموقع.',
                  'Sign in to save and sync your basket with the website.',
                ),
              ),
              const SizedBox(height: 15),
              FilledButton(
                onPressed: onAccount,
                child: Text(s.t('تسجيل الدخول', 'Sign in')),
              ),
            ],
          ),
        ),
      );
    }
    double total(String field) => s.cart.fold<double>(
      0,
      (n, item) =>
          n +
          (known((item['product'] as Map?)?[field]) ?? 0) *
              (known(item['qty']) ?? 0),
    );
    final incomplete = s.cart.any(
      (i) =>
          i['product'] == null ||
          !evaluateProduct(DataRow.from(i['product']), s).complete,
    );
    return RefreshIndicator(
      onRefresh: s.refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            s.t('سلّتك', 'Your basket'),
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 15),
          if (s.cart.isEmpty)
            Padding(
              padding: const EdgeInsets.all(28),
              child: Text(
                s.t(
                  'السلة فارغة. أضف منتجات من السوق.',
                  'Your basket is empty. Add products from the market.',
                ),
              ),
            ),
          if (s.cart.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.t(
                        'المجموع المعروف للحصص',
                        'Known per-serving subtotals',
                      ),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    for (final data in [
                      [
                        'sugar_content',
                        'max_sugar_g',
                        15.0,
                        s.t('السكر', 'Sugar'),
                        'g',
                      ],
                      [
                        'net_carbs',
                        'max_carbs_g',
                        50.0,
                        s.t('صافي الكربوهيدرات', 'Net carbs'),
                        'g',
                      ],
                      [
                        'sodium_content',
                        'max_sodium_mg',
                        1500.0,
                        s.t('الصوديوم', 'Sodium'),
                        'mg',
                      ],
                    ])
                      Builder(
                        builder: (_) {
                          final value = total(data[0] as String),
                              max = s.limit(
                                data[1] as String,
                                data[2] as double,
                              );
                          final ratio = max == 0
                              ? (value > 0 ? 1.01 : 0.0)
                              : value / max;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 15),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: Text(data[3] as String)),
                                    Text(
                                      '${nutrient(value)} / ${nutrient(max)} ${data[4]}',
                                      textDirection: TextDirection.ltr,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 7),
                                LinearProgressIndicator(
                                  value: ratio.clamp(0, 1).toDouble(),
                                  color: ratio > 1
                                      ? Theme.of(context).colorScheme.error
                                      : null,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                if (ratio > 1)
                                  Text(
                                    s.t(
                                      'أعلى من حد الفحص المحدد.',
                                      'Above your screening limit.',
                                    ),
                                    style: TextStyle(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.error,
                                      fontSize: 11,
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    if (incomplete)
                      Text(
                        s.t(
                          'بعض بيانات الملصق ناقصة. هذه مجاميع معروفة وليست إجماليًا كاملًا للاستهلاك.',
                          'Some label data is missing. These are known subtotals, not complete intake.',
                        ),
                        style: const TextStyle(fontSize: 11),
                      ),
                    const SizedBox(height: 12),
                    Text(
                      '${s.t('السعر الإجمالي', 'Total price')}: ${nutrient(total('price'))} ${s.t('ج.م', 'EGP')}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 15),
            for (final item in s.cart)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(15),
                  child: Builder(
                    builder: (_) {
                      final p = item['product'] == null
                          ? null
                          : DataRow.from(item['product']);
                      if (p == null) {
                        return Text(
                          s.t(
                            'منتج لم تعد بياناته متاحة. حدّث السلة أو راجعه على الموقع.',
                            'A product is no longer available. Refresh or review it on the website.',
                          ),
                        );
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          InkWell(
                            onTap: () => showProduct(context, s, p),
                            child: Text(
                              p['title'] as String,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          VerdictChip(result: evaluateProduct(p, s), store: s),
                          const SizedBox(height: 7),
                          Text(
                            evaluateProduct(p, s).reasons.first,
                            style: const TextStyle(fontSize: 11),
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${nutrient(p['price'])} ${s.t('ج.م', 'EGP')}',
                                ),
                              ),
                              IconButton(
                                onPressed: s.writing
                                    ? null
                                    : () async {
                                        try {
                                          await s.changeCart(p, -1);
                                        } catch (e) {
                                          if (context.mounted) {
                                            notify(context, s.message(e));
                                          }
                                        }
                                      },
                                icon: Icon(
                                  item['qty'] == 1
                                      ? Icons.delete_outline
                                      : Icons.remove_circle_outline,
                                ),
                                tooltip: s.t(
                                  'تقليل الكمية',
                                  'Decrease quantity',
                                ),
                              ),
                              Text('${item['qty']}'),
                              IconButton(
                                onPressed: s.writing
                                    ? null
                                    : () => addProduct(context, s, p),
                                icon: const Icon(Icons.add_circle_outline),
                                tooltip: s.t(
                                  'زيادة الكمية',
                                  'Increase quantity',
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
          ],
          const SizedBox(height: 15),
          Text(
            s.t(
              'عدد الوحدات يُستخدم كعدد الحصص للحساب. راجع حجم الحصة على كل عبوة. الفحص إرشادي وليس نصيحة طبية.',
              'Quantities are counted as servings for screening. Check the serving size on each pack. This is guidance, not medical advice.',
            ),
            style: const TextStyle(fontSize: 11),
          ),
        ],
      ),
    );
  }
}
