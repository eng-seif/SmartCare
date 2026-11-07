import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'store.dart';

Uint8List voiceWav(Uint8List pcm) {
  final bytes = Uint8List(44 + pcm.length), data = ByteData.sublistView(bytes);
  void word(int at, String s) => bytes.setRange(at, at + s.length, s.codeUnits);
  word(0, 'RIFF');
  data.setUint32(4, bytes.length - 8, Endian.little);
  word(8, 'WAVE');
  word(12, 'fmt ');
  data.setUint32(16, 16, Endian.little);
  data.setUint16(20, 1, Endian.little);
  data.setUint16(22, 1, Endian.little);
  data.setUint32(24, 16000, Endian.little);
  data.setUint32(28, 32000, Endian.little);
  data.setUint16(32, 2, Endian.little);
  data.setUint16(34, 16, Endian.little);
  word(36, 'data');
  data.setUint32(40, pcm.length, Endian.little);
  bytes.setRange(44, bytes.length, pcm);
  return bytes;
}

class VoiceInput extends StatefulWidget {
  final Store store;
  final bool disabled;
  final String Function() draft;
  final ValueChanged<String> onText;
  final ValueChanged<bool> onBusy;
  const VoiceInput({
    super.key,
    required this.store,
    required this.disabled,
    required this.draft,
    required this.onText,
    required this.onBusy,
  });
  @override
  State<VoiceInput> createState() => _VoiceInputState();
}

class _VoiceInputState extends State<VoiceInput> {
  AudioRecorder? _recorder;
  AudioRecorder get recorder => _recorder ??= AudioRecorder();
  BytesBuilder chunks = BytesBuilder(copy: false);
  StreamSubscription<Uint8List>? subscription;
  Timer? timer;
  bool recording = false,
      processing = false,
      starting = false,
      finishing = false;
  int seconds = 0, size = 0;
  String? error;
  Store get s => widget.store;
  @override
  void dispose() {
    timer?.cancel();
    unawaited(subscription?.cancel());
    unawaited(_recorder?.dispose());
    super.dispose();
  }

  Future<void> start() async {
    if (starting || recording || processing || widget.disabled) return;
    starting = true;
    widget.onBusy(true);
    setState(() => error = null);
    try {
      if (!await recorder.hasPermission()) {
        throw ApiFailure(
          s.t(
            'اسمح باستخدام الميكروفون من إعدادات الهاتف، أو اكتب سؤالك.',
            'Allow microphone access in phone settings, or type your question.',
          ),
        );
      }
      if (!mounted) return;
      chunks = BytesBuilder(copy: false);
      size = 0;
      seconds = 0;
      finishing = false;
      final stream = await recorder.startStream(
        const RecordConfig(
          encoder: AudioEncoder.pcm16bits,
          sampleRate: 16000,
          numChannels: 1,
        ),
      );
      if (!mounted) {
        await recorder.stop();
        return;
      }
      setState(() => recording = true);
      subscription = stream.listen(
        (bytes) {
          if (finishing) return;
          final room = 960000 - size;
          if (room > 0) {
            final next = bytes.length <= room
                ? bytes
                : Uint8List.sublistView(bytes, 0, room);
            chunks.add(next);
            size += next.length;
          }
          if (size >= 960000) unawaited(stop());
        },
        onError: (_) {
          if (mounted) {
            setState(
              () => error = s.t(
                'تعذّر التسجيل؛ تقدر تكتب سؤالك.',
                'Recording failed; you can type your question.',
              ),
            );
          }
          unawaited(stop(cancel: true));
        },
      );
      timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        setState(() => seconds++);
        if (seconds >= 30) unawaited(stop());
      });
    } catch (e) {
      if (mounted) {
        setState(() => error = s.message(e));
        widget.onBusy(false);
      }
    } finally {
      starting = false;
    }
  }

  Future<void> stop({bool cancel = false}) async {
    if (finishing || !recording) return;
    finishing = true;
    timer?.cancel();
    setState(() {
      recording = false;
      processing = !cancel;
    });
    try {
      await recorder.stop();
      await subscription?.cancel();
      subscription = null;
      final pcm = chunks.takeBytes();
      if (cancel || !mounted) return;
      if (pcm.length < 6400) {
        throw ApiFailure(
          s.t(
            'التسجيل قصير جدًا. سجّل سؤالك ثم اضغط إيقاف.',
            'The recording is too short. Record your question, then stop.',
          ),
        );
      }
      final transcript = await s.transcribe(voiceWav(pcm));
      if (!mounted) return;
      if ('${widget.draft()} $transcript'.trim().length > 1500) {
        throw ApiFailure(
          s.t(
            'النص أطول من ١٥٠٠ حرف؛ قلّل المسودة وحاول مجددًا.',
            'The combined draft exceeds 1500 characters. Shorten it and try again.',
          ),
        );
      }
      widget.onText(transcript);
    } catch (e) {
      if (mounted) setState(() => error = s.message(e));
    } finally {
      if (mounted) {
        setState(() => processing = false);
        widget.onBusy(false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Wrap(
        spacing: 8,
        children: [
          OutlinedButton.icon(
            onPressed: widget.disabled || processing || starting
                ? null
                : () => recording ? stop() : start(),
            icon: Icon(recording ? Icons.stop : Icons.mic_none),
            label: Text(
              processing
                  ? s.t('بنحوّل الصوت لنص…', 'Transcribing…')
                  : recording
                  ? '${s.t('إيقاف ومراجعة', 'Stop and review')} $seconds/30'
                  : s.t('سجّل سؤالك بالصوت', 'Record your question'),
            ),
          ),
          if (recording)
            TextButton(
              onPressed: () => stop(cancel: true),
              child: Text(s.t('إلغاء', 'Cancel')),
            ),
        ],
      ),
      Text(
        s.t(
          '٣٠ ثانية بحد أقصى. يُرسل الصوت إلى Gemini عبر Replit للتحويل ولا يُحفظ في التطبيق. راجع النص قبل إرساله. التحويل يستخدم طلبًا من حصة المساعد.',
          'Up to 30 seconds. Audio goes to Gemini via Replit and is not stored by this app. Review the transcript before sending. Transcription uses one assistant allowance request.',
        ),
        style: const TextStyle(fontSize: 10, height: 1.6),
      ),
      if (error != null)
        Text(
          error!,
          style: TextStyle(
            color: Theme.of(context).colorScheme.error,
            fontSize: 11,
          ),
        ),
    ],
  );
}
