import 'package:flutter/material.dart' hide DataRow;
import '../health.dart';
import '../store.dart';

class AssistantPage extends StatelessWidget {
  final Store store;
  const AssistantPage({super.key, required this.store});
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: AssistantCard(store: store),
  );
}

class AssistantCard extends StatefulWidget {
  final Store store;
  const AssistantCard({super.key, required this.store});
  @override
  State<AssistantCard> createState() => _AssistantCardState();
}

class _AssistantCardState extends State<AssistantCard> {
  final input = TextEditingController();
  final List<DataRow> messages = [];
  bool busy = false, useProfile = false;
  String? error;
  Store get s => widget.store;
  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> send([String? suggestion]) async {
    final text = (suggestion ?? input.text).trim();
    if (busy || text.isEmpty || text.length > 1500) return;
    final next = <DataRow>[
      ...messages,
      {'role': 'user', 'content': text},
    ];
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final reply = await s.reply(next, useProfile);
      if (!mounted) return;
      setState(() {
        messages.addAll([
          {'role': 'user', 'content': text},
          {'role': 'assistant', 'content': reply},
        ]);
        input.clear();
      });
    } catch (e) {
      if (mounted) setState(() => error = s.message(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  Icons.chat_bubble_outline,
                  color: Theme.of(context).colorScheme.onPrimary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.t('اسأل مساعد التغذية', 'Ask the food guide'),
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      s.t(
                        'إرشاد عام، بلغة بسيطة',
                        'Plain-language general guidance',
                      ),
                      style: const TextStyle(fontSize: 10),
                    ),
                  ],
                ),
              ),
              if (messages.isNotEmpty)
                IconButton(
                  onPressed: busy
                      ? null
                      : () => setState(() {
                          messages.clear();
                          error = null;
                          input.clear();
                        }),
                  icon: const Icon(Icons.delete_outline),
                  tooltip: s.t('مسح المحادثة', 'Clear chat'),
                ),
            ],
          ),
          const SizedBox(height: 13),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(13),
            ),
            child: Text(
              s.t(
                'أقدر أساعدك تفهم الملصق وتقارن بين المنتجات. الاختيار لك دائمًا، والبيانات المتاحة قد تكون غير مكتملة.',
                'I can help you understand labels and compare products. The choice is yours, and available data may be incomplete.',
              ),
              style: const TextStyle(fontSize: 12, height: 1.7),
            ),
          ),
          if (messages.isNotEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 340),
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 10),
                itemCount: messages.length,
                itemBuilder: (_, i) {
                  final m = messages[i], mine = m['role'] == 'user';
                  return Align(
                    alignment: mine
                        ? AlignmentDirectional.centerEnd
                        : AlignmentDirectional.centerStart,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(11),
                      decoration: BoxDecoration(
                        color: mine
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: SelectableText(
                        m['content'] as String,
                        style: TextStyle(
                          fontSize: 12,
                          color: mine
                              ? Theme.of(context).colorScheme.onPrimary
                              : null,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          if (messages.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Wrap(
                spacing: 6,
                runSpacing: 5,
                children: [
                  for (final question in [
                    s.t('ما معنى مؤشر السكر؟', 'What is glycemic index?'),
                    s.t('كيف أقرأ كمية الحصة؟', 'How do I read serving size?'),
                  ])
                    OutlinedButton(
                      onPressed: busy || !s.ready ? null : () => send(question),
                      child: Text(
                        question,
                        style: const TextStyle(fontSize: 10),
                      ),
                    ),
                ],
              ),
            ),
          if (s.user != null)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              value: useProfile,
              title: Text(
                s.t(
                  'استخدم ملفي الصحي لهذه المحادثة',
                  'Use my health profile for this chat',
                ),
                style: const TextStyle(fontSize: 11),
              ),
              subtitle: Text(
                s.t(
                  'تغيير الاختيار يبدأ محادثة جديدة.',
                  'Changing this starts a new chat.',
                ),
                style: const TextStyle(fontSize: 10),
              ),
              onChanged: busy
                  ? null
                  : (v) => setState(() {
                      useProfile = v!;
                      messages.clear();
                      input.clear();
                      error = null;
                    }),
            ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontSize: 12,
                ),
              ),
            ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: input,
                  enabled: !busy && s.ready,
                  minLines: 1,
                  maxLines: 4,
                  maxLength: 1500,
                  onSubmitted: (_) => send(),
                  decoration: InputDecoration(
                    hintText: s.t('اكتب سؤالك هنا', 'Ask about a food label'),
                    counterText: '',
                    hintStyle: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: busy || !s.ready ? null : send,
                tooltip: s.t('إرسال', 'Send'),
                icon: busy
                    ? const SizedBox(
                        width: 19,
                        height: 19,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send_outlined, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            s.t(
              'تُرسل رسائلك لخدمة ذكاء اصطناعي. لا تكتب بيانات شخصية. الإرشاد ليس تشخيصًا طبيًا، ولا يُشارك ملفك إلا باختيارك.',
              'Messages go to an AI service. Do not include personal details. Guidance is not a diagnosis. Your profile is shared only if you opt in.',
            ),
            style: const TextStyle(fontSize: 10, height: 1.6),
          ),
        ],
      ),
    ),
  );
}
