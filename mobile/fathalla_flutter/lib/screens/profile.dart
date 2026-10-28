import 'package:flutter/material.dart';
import '../health.dart';
import '../store.dart';
import '../widgets.dart';

class ProfileEditor extends StatefulWidget {
  final Store store;
  const ProfileEditor({super.key, required this.store});
  @override
  State<ProfileEditor> createState() => _ProfileEditorState();
}

class _ProfileEditorState extends State<ProfileEditor> {
  final form = GlobalKey<FormState>();
  late final TextEditingController name, age, sugar, carbs, sodium;
  late List<String> conditions;
  late String gender;
  bool busy = false;
  Store get s => widget.store;
  @override
  void initState() {
    super.initState();
    final p = s.profile;
    name = TextEditingController(text: p['full_name']?.toString() ?? '');
    age = TextEditingController(text: p['age']?.toString() ?? '');
    sugar = TextEditingController(text: s.limit('max_sugar_g', 15).toString());
    carbs = TextEditingController(text: s.limit('max_carbs_g', 50).toString());
    sodium = TextEditingController(
      text: s.limit('max_sodium_mg', 1500).toString(),
    );
    conditions = [...s.conditions];
    gender = p['gender'] == 'female' ? 'female' : 'male';
  }

  @override
  void dispose() {
    for (final c in [name, age, sugar, carbs, sodium]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> save() async {
    if (!form.currentState!.validate() || busy) return;
    setState(() => busy = true);
    try {
      await s.saveProfile({
        'full_name': name.text.trim(),
        'age': int.tryParse(age.text),
        'gender': gender,
        'conditions': conditions,
        'max_sugar_g': double.parse(sugar.text),
        'max_carbs_g': double.parse(carbs.text),
        'max_sodium_mg': double.parse(sodium.text),
      });
      if (mounted) {
        Navigator.pop(context);
        notify(
          context,
          s.t(
            'تم حفظ ملفك وإعادة حساب الملاحظات.',
            'Profile saved. Screening has been recalculated.',
          ),
        );
      }
    } catch (e) {
      if (mounted) notify(context, s.message(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
    child: DraggableScrollableSheet(
      expand: false,
      initialChildSize: .88,
      maxChildSize: .95,
      minChildSize: .4,
      builder: (context, scroll) => Form(
        key: form,
        child: ListView(
          controller: scroll,
          padding: const EdgeInsets.all(22),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    s.t('ملفي الصحي', 'My health profile'),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: busy ? null : () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 15),
            TextFormField(
              controller: name,
              maxLength: 100,
              decoration: InputDecoration(labelText: s.t('الاسم', 'Name')),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: age,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: s.t('العمر (اختياري)', 'Age (optional)'),
              ),
              validator: (v) =>
                  (v?.isEmpty ?? true) ||
                      (int.tryParse(v!) != null &&
                          int.parse(v) >= 12 &&
                          int.parse(v) <= 110)
                  ? null
                  : s.t(
                      'العمر من ١٢ إلى ١١٠.',
                      'Age must be between 12 and 110.',
                    ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: gender,
              decoration: InputDecoration(labelText: s.t('النوع', 'Gender')),
              items: [
                DropdownMenuItem(
                  value: 'male',
                  child: Text(s.t('ذكر', 'Male')),
                ),
                DropdownMenuItem(
                  value: 'female',
                  child: Text(s.t('أنثى', 'Female')),
                ),
              ],
              onChanged: busy ? null : (v) => setState(() => gender = v!),
            ),
            const SizedBox(height: 20),
            Text(
              s.t(
                'الحالات التي تُستخدم في الفحص',
                'Conditions used for screening',
              ),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            for (final c in conditionLabels.entries)
              CheckboxListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(c.value[s.ar ? 0 : 1]),
                value: conditions.contains(c.key),
                onChanged: busy
                    ? null
                    : (on) => setState(() {
                        if (on!) {
                          conditions.add(c.key);
                        } else {
                          conditions.remove(c.key);
                        }
                      }),
              ),
            const SizedBox(height: 18),
            Text(
              s.t(
                'حدود الفحص لمجموع الحصص',
                'Screening limits across servings',
              ),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            for (final field in [
              (sugar, s.t('السكر (جم)', 'Sugar (g)')),
              (carbs, s.t('صافي الكربوهيدرات (جم)', 'Net carbs (g)')),
              (sodium, s.t('الصوديوم (مجم)', 'Sodium (mg)')),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 13),
                child: TextFormField(
                  controller: field.$1,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(labelText: field.$2),
                  validator: (v) => known(v) == null || known(v)! > 100000
                      ? s.t(
                          'اكتب رقمًا من صفر إلى ١٠٠٠٠٠.',
                          'Enter a number from 0 to 100000.',
                        )
                      : null,
                ),
              ),
            Text(
              s.t(
                'هذه حدود للفحص وليست توصية علاجية. اتّبع الحدود التي يوصي بها طبيبك.',
                'These are screening limits, not treatment recommendations. Follow the limits advised by your clinician.',
              ),
              style: const TextStyle(fontSize: 11),
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: busy ? null : save,
              child: Text(
                busy
                    ? s.t('جارٍ الحفظ…', 'Saving…')
                    : s.t('حفظ الملف', 'Save profile'),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    ),
  );
}
