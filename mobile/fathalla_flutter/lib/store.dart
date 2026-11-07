import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'health.dart';

const apiBase = String.fromEnvironment('API_BASE_URL');

class ApiFailure implements Exception {
  final String message;
  const ApiFailure(this.message);
  @override
  String toString() => message;
}

class Store extends ChangeNotifier {
  bool ar = true,
      dark = false,
      loading = false,
      writing = false,
      ready = false,
      tutorialSeen = false;
  String? error;
  List<DataRow> products = [], cart = [];
  DataRow profile = {};
  SupabaseClient? client;
  SharedPreferences? _prefs;
  StreamSubscription<AuthState>? _auth;
  int _generation = 0;
  User? get user => client?.auth.currentUser;
  List<String> get conditions => List<String>.from(profile['conditions'] ?? []);
  String t(String arabic, String english) => ar ? arabic : english;
  double limit(String key, double fallback) => known(profile[key]) ?? fallback;

  Future<void> start() async {
    _prefs ??= await SharedPreferences.getInstance();
    ar = _prefs!.getBool('arabic') ?? true;
    dark = _prefs!.getBool('dark') ?? false;
    tutorialSeen = _prefs!.getBool('tutorial-v1') ?? false;
    loading = true;
    error = null;
    notifyListeners();
    try {
      if (client == null) {
        final base = Uri.tryParse(apiBase);
        if (base == null || base.scheme != 'https' || base.host.isEmpty) {
          throw const ApiFailure(
            'API_BASE_URL must be a published HTTPS address.',
          );
        }
        final response = await http
            .get(Uri.parse('$apiBase/mobile/config'))
            .timeout(const Duration(seconds: 20));
        if (response.statusCode != 200) {
          throw ApiFailure(
            t(
              'اتصال الموبايل غير متاح بعد. يجب نشر آخر نسخة من الموقع ثم الضغط على إعادة المحاولة.',
              'Mobile connection is not available yet. Publish the latest website, then retry.',
            ),
          );
        }
        final config = jsonDecode(response.body) as Map<String, dynamic>;
        await Supabase.initialize(
          url: config['supabaseUrl'] as String,
          publishableKey: config['supabasePublishableKey'] as String,
          debug: false,
        );
        client = Supabase.instance.client;
        _auth = client!.auth.onAuthStateChange.listen((event) {
          if (event.event == AuthChangeEvent.signedIn ||
              event.event == AuthChangeEvent.signedOut ||
              event.event == AuthChangeEvent.userUpdated) {
            _generation++;
            profile = {};
            cart = [];
            unawaited(refresh());
          }
        });
      }
      await refresh();
    } catch (e) {
      error = message(e);
      loading = false;
      notifyListeners();
    }
  }

  Future<void> setLanguage() async {
    ar = !ar;
    await _prefs?.setBool('arabic', ar);
    notifyListeners();
  }

  Future<void> finishTutorial() async {
    tutorialSeen = true;
    try {
      await _prefs?.setBool('tutorial-v1', true);
    } catch (_) {
      // A storage failure must never block skipping the tutorial.
    } finally {
      notifyListeners();
    }
  }

  Future<String> transcribe(Uint8List wav) async {
    final token = client?.auth.currentSession?.accessToken;
    final response = await http
        .post(
          Uri.parse('$apiBase/assistant/transcribe'),
          headers: {
            'Content-Type': 'audio/wav',
            'X-Voice-Language': ar ? 'ar' : 'en',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: wav,
        )
        .timeout(const Duration(seconds: 42));
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200 || body['text'] is! String) {
      throw ApiFailure(
        body['error'] as String? ??
            t(
              'تحويل الصوت غير متاح؛ اكتب سؤالك.',
              'Voice is unavailable; please type your question.',
            ),
      );
    }
    return body['text'] as String;
  }

  Future<void> setDark() async {
    dark = !dark;
    await _prefs?.setBool('dark', dark);
    notifyListeners();
  }

  String message(Object e) => e is ApiFailure
      ? e.message
      : e is AuthException
      ? e.message
      : t(
          'تعذّر الاتصال أو حفظ التغيير. لم نستخدم بيانات تجريبية. تحقق من الإنترنت وحاول مجددًا.',
          'Could not connect or save the change. No sample data was substituted. Check your connection and retry.',
        );

  Future<void> refresh() async {
    if (client == null) return;
    final generation = _generation, id = user?.id;
    loading = true;
    error = null;
    notifyListeners();
    try {
      final nextProducts = await client!
          .from('products')
          .select()
          .order('title');
      DataRow nextProfile = {};
      List<DataRow> nextCart = [];
      if (id != null) {
        nextProfile =
            await client!
                .from('profiles')
                .select()
                .eq('id', id)
                .maybeSingle() ??
            {};
        nextCart = List<DataRow>.from(
          await client!
              .from('cart_items')
              .select('qty,product_id,product:products(*)')
              .eq('user_id', id),
        );
      }
      if (generation != _generation || id != user?.id) return;
      products = List<DataRow>.from(nextProducts);
      profile = nextProfile;
      cart = nextCart;
      ready = true;
    } catch (e) {
      if (generation == _generation) error = message(e);
    } finally {
      if (generation == _generation) {
        loading = false;
        notifyListeners();
      }
    }
  }

  Future<void> changeCart(DataRow p, int delta) async {
    final id = user?.id;
    if (client == null || id == null) {
      throw ApiFailure(
        t(
          'سجّل الدخول لإضافة منتجات إلى السلة.',
          'Sign in to add products to your basket.',
        ),
      );
    }
    if (writing) return;
    writing = true;
    notifyListeners();
    try {
      final item = await client!
          .from('cart_items')
          .select('qty')
          .eq('user_id', id)
          .eq('product_id', p['id'])
          .maybeSingle();
      final qty = ((item?['qty'] as num?)?.toInt() ?? 0) + delta;
      if (item != null && qty <= 0) {
        await client!
            .from('cart_items')
            .delete()
            .eq('user_id', id)
            .eq('product_id', p['id']);
      } else if (qty > 0) {
        await client!.from('cart_items').upsert({
          'user_id': id,
          'product_id': p['id'],
          'qty': qty,
        }, onConflict: 'user_id,product_id');
      }
      await refresh();
      if (error != null) throw ApiFailure(error!);
    } finally {
      writing = false;
      notifyListeners();
    }
  }

  Future<void> saveProfile(DataRow values) async {
    final id = user?.id;
    if (id == null || client == null) {
      throw ApiFailure(t('سجّل الدخول أولًا.', 'Please sign in first.'));
    }
    await client!.from('profiles').upsert({...values, 'id': id});
    await refresh();
    if (error != null) throw ApiFailure(error!);
  }

  Future<String> reply(List<DataRow> messages, bool useProfile) async {
    final token = client?.auth.currentSession?.accessToken;
    final response = await http
        .post(
          Uri.parse('$apiBase/assistant/chat'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'lang': ar ? 'ar' : 'en',
            'useProfile': useProfile,
            'messages': messages
                .skip(messages.length > 10 ? messages.length - 10 : 0)
                .toList(),
          }),
        )
        .timeout(const Duration(seconds: 42));
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw ApiFailure(
        body['error'] as String? ??
            t('المساعد غير متاح الآن.', 'The assistant is unavailable.'),
      );
    }
    if (body['reply'] is! String || (body['reply'] as String).trim().isEmpty) {
      throw ApiFailure(
        t('لم يصل رد مكتمل.', 'No complete reply was received.'),
      );
    }
    return body['reply'] as String;
  }

  @override
  void dispose() {
    _auth?.cancel();
    super.dispose();
  }
}
