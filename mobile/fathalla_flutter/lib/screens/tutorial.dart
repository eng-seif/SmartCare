import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../store.dart';

class TutorialPage extends StatefulWidget {
  final Store store;
  final VoidCallback onContinue, onLogin;
  const TutorialPage({
    super.key,
    required this.store,
    required this.onContinue,
    required this.onLogin,
  });
  @override
  State<TutorialPage> createState() => _TutorialPageState();
}

class _TutorialPageState extends State<TutorialPage> {
  VideoPlayerController? player;
  bool failed = false, loading = true;
  Store get s => widget.store;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final base = Uri.tryParse(apiBase);
      if (base == null || base.scheme != 'https') throw const FormatException();
      final controller = VideoPlayerController.networkUrl(
        base.resolve('/tutorial/video'),
      );
      player = controller;
      await controller.initialize().timeout(const Duration(seconds: 15));
      if (!mounted) return;
      controller.addListener(() {
        if (mounted) {
          setState(() {
            if (controller.value.hasError) failed = true;
          });
        }
      });
      setState(() => loading = false);
    } catch (_) {
      if (mounted) {
        setState(() {
          failed = true;
          loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    player?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.all(22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          s.t('قبل ما تبدأ', 'Before you begin'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Text(
          s.t(
            'تعرّف على التطبيق في نصف دقيقة',
            'Get to know the app in half a minute',
          ),
          style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        Text(
          s.t(
            'شرح البحث وقراءة الملصق ومساعد التغذية. تقدر تتخطاه في أي وقت.',
            'A short Arabic guide to browsing, labels and the nutrition assistant. You can skip at any time.',
          ),
        ),
        const SizedBox(height: 18),
        ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: ColoredBox(
              color: Colors.black,
              child: failed
                  ? Center(
                      child: Text(
                        s.t(
                          'تعذّر تشغيل الفيديو. تقدر تكمل التسجيل.',
                          'Video unavailable. You can continue to registration.',
                        ),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white),
                      ),
                    )
                  : loading
                  ? const Center(child: CircularProgressIndicator())
                  : VideoPlayer(player!),
            ),
          ),
        ),
        if (!failed && !loading) ...[
          VideoProgressIndicator(
            player!,
            allowScrubbing: true,
            padding: const EdgeInsets.symmetric(vertical: 10),
          ),
          OutlinedButton.icon(
            onPressed: () => setState(() {
              if (player!.value.isPlaying) {
                player!.pause();
              } else {
                if (player!.value.position >= player!.value.duration) {
                  player!.seekTo(Duration.zero);
                }
                player!.play();
              }
            }),
            icon: Icon(
              player!.value.isPlaying ? Icons.pause : Icons.play_arrow,
            ),
            label: Text(
              player!.value.isPlaying
                  ? s.t('إيقاف مؤقت', 'Pause')
                  : s.t('شاهد الشرح', 'Play guide'),
            ),
          ),
        ],
        const SizedBox(height: 18),
        FilledButton(
          onPressed: widget.onContinue,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              s.t('تخطي والانتقال للتسجيل', 'Skip and create an account'),
            ),
          ),
        ),
        TextButton(
          onPressed: widget.onLogin,
          child: Text(
            s.t('عندي حساب — تسجيل الدخول', 'Already registered? Sign in'),
          ),
        ),
        Text(
          s.t(
            'المساعد يقدّم معلومات عامة، مش تشخيصًا أو وصف علاج.',
            'The assistant offers general education, not diagnosis or treatment.',
          ),
          style: const TextStyle(fontSize: 11),
        ),
      ],
    ),
  );
}
