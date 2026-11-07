import 'package:flutter/material.dart';
import '../store.dart';
import '../widgets.dart';
import 'profile.dart';
import 'tutorial.dart';

class AccountPage extends StatefulWidget {
  final Store store;
  const AccountPage({super.key, required this.store});
  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final form = GlobalKey<FormState>();
  final email = TextEditingController(), password = TextEditingController();
  bool register = false, busy = false, hidden = true;
  bool tutorialDismissed = false, replayTutorial = false;
  Store get s => widget.store;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate() || busy) return;
    if (s.client == null) {
      notify(
        context,
        s.t(
          'اتصال الحسابات غير متاح بعد. انشر أحدث نسخة من الموقع ثم أعد المحاولة.',
          'Account connection is not available yet. Publish the latest website and retry.',
        ),
      );
      return;
    }
    setState(() => busy = true);
    try {
      if (register) {
        final result = await s.client!.auth.signUp(
          email: email.text.trim(),
          password: password.text,
        );
        if (mounted && result.session == null) {
          notify(
            context,
            s.t(
              'راجع بريدك لتأكيد الحساب، ثم ارجع لتسجيل الدخول.',
              'Check your email to confirm your account, then return to sign in.',
            ),
          );
        }
      } else {
        await s.client!.auth.signInWithPassword(
          email: email.text.trim(),
          password: password.text,
        );
      }
      password.clear();
      await s.refresh();
    } catch (e) {
      if (mounted) notify(context, s.message(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (s.user != null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            s.t('حسابي', 'My account'),
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (s.profile['full_name'] as String?)?.isNotEmpty == true
                        ? s.profile['full_name'] as String
                        : s.t('مرحبًا بك', 'Welcome'),
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(s.user!.email ?? ''),
                  const SizedBox(height: 18),
                  Text(
                    s.t(
                      'ملفك محفوظ في حسابك على نفس خدمة الموقع. لا ننسخ البيانات الصحية إلى تخزين الهاتف، ولا تُرسل للمساعد إلا بموافقتك داخل المحادثة.',
                      'Your profile uses the website’s existing account service. Health data is not copied to phone storage or sent to the assistant without your chat opt-in.',
                    ),
                    style: const TextStyle(fontSize: 12, height: 1.7),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: s.loading
                        ? null
                        : () => showModalBottomSheet<void>(
                            context: context,
                            useSafeArea: true,
                            isScrollControlled: true,
                            builder: (_) => ProfileEditor(store: s),
                          ),
                    icon: const Icon(Icons.monitor_heart_outlined),
                    label: Text(
                      s.t(
                        'تعديل ملفي وحدود الفحص',
                        'Edit health profile and limits',
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        await s.client!.auth.signOut();
                        if (context.mounted) {
                          notify(
                            context,
                            s.t('تم تسجيل الخروج.', 'Signed out.'),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) notify(context, s.message(e));
                      }
                    },
                    icon: const Icon(Icons.logout),
                    label: Text(s.t('تسجيل الخروج', 'Sign out')),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }
    if (replayTutorial || (!s.tutorialSeen && !tutorialDismissed)) {
      return TutorialPage(
        store: s,
        onContinue: () {
          s.finishTutorial();
          setState(() {
            tutorialDismissed = true;
            replayTutorial = false;
            register = true;
          });
        },
        onLogin: () {
          s.finishTutorial();
          setState(() {
            tutorialDismissed = true;
            replayTutorial = false;
            register = false;
          });
        },
      );
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Form(
        key: form,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextButton.icon(
              onPressed: () => setState(() => replayTutorial = true),
              icon: const Icon(Icons.play_circle_outline),
              label: Text(
                s.t(
                  'شاهد شرح الاستخدام مرة أخرى',
                  'Watch the usage guide again',
                ),
              ),
            ),
            Text(
              register
                  ? s.t('حساب جديد', 'Create an account')
                  : s.t('أهلًا بعودتك', 'Welcome back'),
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              s.t(
                'استخدم نفس حساب الموقع لمزامنة ملفك وسلّتك.',
                'Use your website account to sync your profile and basket.',
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: email,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              autofillHints: const [AutofillHints.email],
              decoration: InputDecoration(
                labelText: s.t('البريد الإلكتروني', 'Email address'),
              ),
              validator: (v) =>
                  v == null ||
                      !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v.trim())
                  ? s.t('اكتب بريدًا صحيحًا.', 'Enter a valid email.')
                  : null,
            ),
            const SizedBox(height: 15),
            TextFormField(
              controller: password,
              obscureText: hidden,
              textDirection: TextDirection.ltr,
              autofillHints: [
                register ? AutofillHints.newPassword : AutofillHints.password,
              ],
              decoration: InputDecoration(
                labelText: s.t('كلمة المرور', 'Password'),
                suffixIcon: IconButton(
                  onPressed: () => setState(() => hidden = !hidden),
                  icon: Icon(
                    hidden
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                ),
              ),
              validator: (v) =>
                  v == null || (register ? v.length < 8 : v.isEmpty)
                  ? s.t(
                      'اكتب كلمة مرور صالحة؛ للحساب الجديد ٨ أحرف على الأقل.',
                      'Enter a valid password; new accounts require at least 8 characters.',
                    )
                  : null,
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: busy ? null : submit,
              child: Text(
                busy
                    ? s.t('انتظر…', 'Please wait…')
                    : register
                    ? s.t('إنشاء الحساب', 'Create account')
                    : s.t('تسجيل الدخول', 'Sign in'),
              ),
            ),
            TextButton(
              onPressed: busy
                  ? null
                  : () => setState(() => register = !register),
              child: Text(
                register
                    ? s.t(
                        'لديك حساب؟ سجّل الدخول',
                        'Already registered? Sign in',
                      )
                    : s.t(
                        'جديد هنا؟ أنشئ حسابًا',
                        'New here? Create an account',
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
