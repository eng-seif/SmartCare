typedef DataRow = Map<String, dynamic>;

const conditionLabels = {
  't2d': ['سكري النوع الثاني', 'Type 2 diabetes'],
  't1d': ['سكري النوع الأول', 'Type 1 diabetes'],
  'prediabetes': [
    'ما قبل السكري / مقاومة الإنسولين',
    'Prediabetes / insulin resistance',
  ],
  'hypertension': ['ضغط الدم المرتفع', 'Hypertension'],
  'cardio': ['القلب / الكوليسترول', 'Cardiovascular / cholesterol'],
  'lactose': ['عدم تحمل اللاكتوز', 'Lactose intolerance'],
  'celiac': ['حساسية الجلوتين / السيلياك', 'Celiac / gluten sensitivity'],
};

double? known(dynamic v) {
  if (v == null || v == '') return null;
  final n = v is num ? v.toDouble() : double.tryParse(v.toString());
  return n != null && n.isFinite && n >= 0 ? n : null;
}

String nutrient(dynamic v, [String unit = '']) {
  final n = known(v);
  return n == null ? '—' : '${n == n.roundToDouble() ? n.toInt() : n}$unit';
}

class ScreenResult {
  int level = 0;
  bool complete = true;
  final List<String> reasons = [];
}

/// Mirrors the web's per-serving rules. Unknown is never zero or a safety claim.
ScreenResult screen(DataRow p, List<String> conditions, bool ar) {
  final r = ScreenResult();
  void flag(int level, String a, String e) {
    if (level > r.level) r.level = level;
    r.reasons.add(ar ? a : e);
  }

  void missing(String a, String e) {
    r.complete = false;
    flag(
      1,
      'بيانات $a غير متاحة. راجع العبوة.',
      'Missing label data: $e. Check the pack.',
    );
  }

  for (final entry in {
    'sugar_content': ['السكر', 'sugar'],
    'net_carbs': ['صافي الكربوهيدرات', 'net carbs'],
    'sodium_content': ['الصوديوم', 'sodium'],
  }.entries) {
    if (known(p[entry.key]) == null) missing(entry.value[0], entry.value[1]);
  }
  final diabetes = conditions.any(
    (x) => ['t1d', 't2d', 'prediabetes'].contains(x),
  );
  final gi = known(p['glycemic_index']), gl = known(p['glycemic_load']);
  if (diabetes && gi == null && gl == null) {
    missing('مؤشر أو حمل السكر', 'GI or GL');
  }
  if (gi != null) {
    if (gi >= 70) {
      flag(
        diabetes ? 2 : 1,
        'مؤشر السكر مرتفع ($gi).',
        'High glycemic index ($gi).',
      );
    } else if (gi > 55) {
      flag(1, 'مؤشر السكر متوسط ($gi).', 'Moderate glycemic index ($gi).');
    }
  }
  if (gl != null) {
    if (gl >= 20) {
      flag(
        diabetes ? 2 : 1,
        'حمل السكر مرتفع ($gl).',
        'High glycemic load ($gl).',
      );
    } else if (gl > 10) {
      flag(1, 'حمل السكر متوسط ($gl).', 'Moderate glycemic load ($gl).');
    }
  }
  if ((known(p['sugar_content']) ?? 0) > 10) {
    flag(
      1,
      'السكر أعلى من ١٠ جم للحصة؛ انتبه للكمية.',
      'Sugar above 10g per serving; check portions.',
    );
  }
  if (diabetes && (known(p['net_carbs']) ?? 0) > 30) {
    flag(
      1,
      'صافي الكربوهيدرات أعلى من ٣٠ جم للحصة.',
      'Net carbs above 30g per serving.',
    );
  }
  if ((known(p['sodium_content']) ?? 0) > 400) {
    flag(
      conditions.contains('hypertension') ? 2 : 1,
      'الصوديوم مرتفع للحصة.',
      'High sodium per serving.',
    );
  }
  if (conditions.contains('cardio')) {
    final fat = known(p['sat_fat_g']);
    if (fat == null) {
      missing('الدهون المشبعة', 'saturated fat');
    } else if (fat > 5) {
      flag(
        1,
        'الدهون المشبعة أعلى من ٥ جم للحصة.',
        'Saturated fat above 5g per serving.',
      );
    }
  }
  for (final c in ['lactose', 'celiac']) {
    if (!conditions.contains(c)) continue;
    final field = c == 'lactose' ? 'is_lactose_free' : 'is_gluten_free';
    final a = c == 'lactose' ? 'اللاكتوز' : 'الجلوتين';
    final e = c == 'lactose' ? 'lactose' : 'gluten';
    if (p[field] == false) {
      flag(2, 'يحتوي على $a.', 'Contains $e.');
    } else if (p[field] != true) {
      missing('خلو المنتج من $a', '$e-free status');
    }
  }
  if (r.reasons.isEmpty) {
    r.reasons.add(
      ar
          ? 'لا ملاحظات حسب قواعد الفحص المختارة. حجم الحصة ونصيحة الطبيب مهمان.'
          : 'No flags under the selected rules. Portion size and your clinician’s advice still matter.',
    );
  }
  return r;
}
