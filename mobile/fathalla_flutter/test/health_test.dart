import 'package:flutter_test/flutter_test.dart';
import 'package:fathalla_health/health.dart';

void main() {
  final DataRow base = {
    'sugar_content': 0,
    'net_carbs': 0,
    'sodium_content': 0,
    'glycemic_index': 55,
    'glycemic_load': 10,
  };
  test('Unknown is not zero; negative and nonfinite labels stay unknown', () {
    for (final v in [null, '', -1, double.nan, double.infinity, 'unknown']) {
      expect(known(v), isNull);
    }
    expect(known(0), 0);
    expect(known('12.5'), 12.5);
    expect(nutrient(null), '—');
    expect(screen({}, [], false).complete, false);
    expect(screen({}, [], false).level, 1);
  });
  test('GI and GL boundaries match web rules', () {
    expect(screen(base, ['t2d'], false).level, 0);
    expect(screen({...base, 'glycemic_index': 56}, ['t2d'], false).level, 1);
    expect(screen({...base, 'glycemic_index': 70}, ['t2d'], false).level, 2);
    expect(screen({...base, 'glycemic_index': 70}, [], false).level, 1);
    expect(screen({...base, 'glycemic_load': 20}, ['t1d'], true).level, 2);
  });
  test('Sodium, carb and allergy rules respect conditions', () {
    expect(
      screen({...base, 'sodium_content': 401}, ['hypertension'], false).level,
      2,
    );
    expect(screen({...base, 'net_carbs': 31}, ['prediabetes'], false).level, 1);
    expect(
      screen({...base, 'is_gluten_free': false}, ['celiac'], false).level,
      2,
    );
    expect(screen(base, ['lactose'], true).complete, false);
    expect(
      screen({...base, 'is_lactose_free': true}, ['lactose'], true).level,
      0,
    );
    expect(screen(base, ['cardio'], false).complete, false);
    expect(screen({...base, 'sat_fat_g': 6}, ['cardio'], false).level, 1);
  });
}
