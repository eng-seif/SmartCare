import 'package:flutter/material.dart' hide DataRow;
import 'health.dart';
import 'store.dart';

void notify(BuildContext context, String text) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
}

Future<void> addProduct(BuildContext context, Store s, DataRow p) async {
  try {
    await s.changeCart(p, 1);
    if (context.mounted) {
      notify(context, s.t('تمت الإضافة إلى السلة.', 'Added to your basket.'));
    }
  } catch (e) {
    if (context.mounted) notify(context, s.message(e));
  }
}

class ProductTile extends StatelessWidget {
  final DataRow product;
  final Store store;
  const ProductTile({super.key, required this.product, required this.store});
  @override
  Widget build(BuildContext context) {
    final p = product, s = store, result = screen(p: product, s: store);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => showProduct(context, s, p),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: productImage(p, borderRadius: BorderRadius.zero),
            ),
            Padding(
              padding: const EdgeInsets.all(13),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p['title']?.toString() ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${p['category'] ?? ''} · ${p['serving_size'] ?? s.t('راجع العبوة', 'Check pack')}',
                    style: const TextStyle(fontSize: 10),
                  ),
                  const SizedBox(height: 8),
                  VerdictChip(result: result, store: s),
                  const SizedBox(height: 7),
                  Text(
                    result.reasons.first,
                    style: const TextStyle(fontSize: 10),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${nutrient(p['price'])} ${s.t('ج.م', 'EGP')}',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: s.writing
                            ? null
                            : () => addProduct(context, s, p),
                        icon: const Icon(Icons.add_shopping_cart, size: 16),
                        label: Text(s.t('للسلة', 'Add')),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  ScreenResult screen({required DataRow p, required Store s}) =>
      evaluateProduct(p, s);
}

ScreenResult evaluateProduct(DataRow p, Store s) =>
    screen(p, s.conditions, s.ar);

Uri? productImageUri(String? value, {String base = apiBase}) {
  final raw = value?.trim() ?? '';
  if (raw.isEmpty) return null;
  final uri = Uri.tryParse(raw);
  if (uri == null) return null;
  final resolved = uri.hasScheme ? uri : Uri.tryParse(base)?.resolveUri(uri);
  if (resolved == null ||
      !['https', 'http'].contains(resolved.scheme) ||
      resolved.host.isEmpty) {
    return null;
  }
  return resolved;
}

Widget productImage(
  DataRow p, {
  BoxFit fit = BoxFit.cover,
  BorderRadius borderRadius = const BorderRadius.all(Radius.circular(14)),
}) {
  final url = productImageUri(p['image_url']?.toString());
  final fallback = Container(
    decoration: BoxDecoration(
      color: const Color(0xFFE8DDCB),
      borderRadius: borderRadius,
    ),
    child: const Icon(
      Icons.inventory_2_outlined,
      color: Color(0xFF867966),
      size: 33,
    ),
  );
  return url == null
      ? fallback
      : ClipRRect(
          borderRadius: borderRadius,
          child: Image.network(
            url.toString(),
            width: double.infinity,
            height: double.infinity,
            fit: fit,
            semanticLabel: p['title']?.toString(),
            loadingBuilder: (context, child, progress) => progress == null
                ? child
                : const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
            errorBuilder: (_, __, ___) => fallback,
          ),
        );
}

class VerdictChip extends StatelessWidget {
  final ScreenResult result;
  final Store store;
  const VerdictChip({super.key, required this.result, required this.store});
  @override
  Widget build(BuildContext context) {
    final s = store;
    final text = !result.complete
        ? s.t('بيانات ناقصة', 'Data missing')
        : result.level == 0
        ? s.t('لا ملاحظات', 'No flags')
        : result.level == 2
        ? s.t('راجع الاختيار', 'Review choice')
        : s.t('انتبه للحصة', 'Check serving');
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: result.level == 2
            ? (dark ? const Color(0xFF4A302D) : const Color(0xFFF8E7E3))
            : Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: result.level == 2
              ? (dark ? const Color(0xFFEFAAA0) : const Color(0xFF8B3430))
              : null,
        ),
      ),
    );
  }
}

Future<void> showProduct(
  BuildContext context,
  Store s,
  DataRow p,
) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (context) => DraggableScrollableSheet(
    expand: false,
    initialChildSize: .72,
    minChildSize: .4,
    maxChildSize: .95,
    builder: (context, scroll) => ListView(
      controller: scroll,
      padding: const EdgeInsets.all(22),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                p['title']?.toString() ?? '',
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(height: 180, child: productImage(p, fit: BoxFit.contain)),
        const SizedBox(height: 15),
        Text(
          '${s.t('الحصة', 'Serving')}: ${p['serving_size'] ?? s.t('غير متاحة — راجع العبوة', 'Unknown — check the pack')}',
        ),
        const SizedBox(height: 12),
        VerdictChip(result: evaluateProduct(p, s), store: s),
        ...evaluateProduct(p, s).reasons.map(
          (r) => Padding(
            padding: const EdgeInsets.only(top: 9),
            child: Text('• $r'),
          ),
        ),
        const SizedBox(height: 16),
        ...{
          s.t('السكر', 'Sugar'): nutrient(p['sugar_content'], ' g'),
          s.t('صافي الكربوهيدرات', 'Net carbs'): nutrient(p['net_carbs'], ' g'),
          s.t('الصوديوم', 'Sodium'): nutrient(p['sodium_content'], ' mg'),
          s.t('مؤشر السكر', 'Glycemic index'): nutrient(p['glycemic_index']),
          s.t('حمل السكر', 'Glycemic load'): nutrient(p['glycemic_load']),
          s.t('الدهون المشبعة', 'Saturated fat'): nutrient(
            p['sat_fat_g'],
            ' g',
          ),
        }.entries.map(
          (e) => ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            title: Text(e.key),
            trailing: Text(e.value, textDirection: TextDirection.ltr),
          ),
        ),
        Text(
          s.t(
            'الفحص إرشادي وليس تشخيصًا أو ضمانًا لملاءمة الطعام. البيانات المجهولة لا تعني صفرًا.',
            'Screening is guidance, not a diagnosis or a guarantee. Unknown data does not mean zero.',
          ),
          style: const TextStyle(fontSize: 11),
        ),
        const SizedBox(height: 18),
        FilledButton.icon(
          onPressed: s.writing ? null : () => addProduct(context, s, p),
          icon: const Icon(Icons.add_shopping_cart),
          label: Text(s.t('أضف إلى السلة', 'Add to basket')),
        ),
        const SizedBox(height: 20),
      ],
    ),
  ),
);
