import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_theme.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

class ChatMessage {
  final String id;
  final String text;
  final bool isSender;
  final DateTime timestamp;
  final String? imageUrl;
  final bool isLocation;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.isSender,
    required this.timestamp,
    this.imageUrl,
    this.isLocation = false,
  });
}

final chatMessagesProvider =
    StateNotifierProvider.family<ChatNotifier, List<ChatMessage>, String>(
  (ref, conversationId) => ChatNotifier(),
);

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier()
      : super([
          ChatMessage(
            id: 'm1',
            text: 'Hello! I\'m on my way to your location.',
            isSender: false,
            timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
          ),
          ChatMessage(
            id: 'm2',
            text: 'Great! I\'ll be here. Please ring the bell.',
            isSender: true,
            timestamp: DateTime.now().subtract(const Duration(minutes: 14)),
          ),
          ChatMessage(
            id: 'm3',
            text: 'Reached your area, looking for parking.',
            isSender: false,
            timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
          ),
        ]);

  void sendMessage(String text) {
    state = [
      ...state,
      ChatMessage(
        id: 'm${state.length + 1}',
        text: text,
        isSender: true,
        timestamp: DateTime.now(),
      ),
    ];

    // Simulate reply after 1.5s
    Future.delayed(const Duration(milliseconds: 1500), () {
      state = [
        ...state,
        ChatMessage(
          id: 'm${state.length + 1}',
          text: 'Got it! I\'ll be there in a moment.',
          isSender: false,
          timestamp: DateTime.now(),
        ),
      ];
    });
  }

  void shareLocation() {
    state = [
      ...state,
      ChatMessage(
        id: 'm${state.length + 1}',
        text: 'Shared my location',
        isSender: true,
        timestamp: DateTime.now(),
        isLocation: true,
      ),
    ];
  }
}

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String recipientName;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.recipientName,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _msgController = TextEditingController();
  final _scrollController = ScrollController();
  bool _showAttachMenu = false;

  void _sendMessage() {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;
    _msgController.clear();
    ref
        .read(chatMessagesProvider(widget.conversationId).notifier)
        .sendMessage(text);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickImage() async {
    setState(() => _showAttachMenu = false);
    final picker = ImagePicker();
    await picker.pickImage(source: ImageSource.gallery);
    // TODO: upload and send image message
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages =
        ref.watch(chatMessagesProvider(widget.conversationId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  widget.recipientName.isEmpty
                      ? 'S'
                      : widget.recipientName[0],
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.recipientName,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Online',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.success,
                            fontSize: 11,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_rounded, color: AppColors.success),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.video_call_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                final isFirst = index == 0 ||
                    messages[index - 1].isSender != msg.isSender;

                return AnimationConfiguration.staggeredList(
                  position: index,
                  duration: const Duration(milliseconds: 300),
                  child: FadeInAnimation(
                    child: Padding(
                      padding: EdgeInsets.only(
                        bottom: isFirst ? 8 : 4,
                        top: isFirst ? 8 : 0,
                      ),
                      child: _MessageBubble(
                        message: msg,
                        showAvatar: !msg.isSender && isFirst,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Attachment menu
          if (_showAttachMenu)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(
                    top: BorderSide(color: AppColors.divider, width: 0.5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _AttachOption(
                    icon: Icons.image_rounded,
                    label: 'Gallery',
                    color: AppColors.success,
                    onTap: _pickImage,
                  ),
                  _AttachOption(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    color: AppColors.info,
                    onTap: () => setState(() => _showAttachMenu = false),
                  ),
                  _AttachOption(
                    icon: Icons.location_on_rounded,
                    label: 'Location',
                    color: AppColors.error,
                    onTap: () {
                      setState(() => _showAttachMenu = false);
                      ref
                          .read(chatMessagesProvider(widget.conversationId)
                              .notifier)
                          .shareLocation();
                    },
                  ),
                  _AttachOption(
                    icon: Icons.description_rounded,
                    label: 'Document',
                    color: AppColors.warning,
                    onTap: () => setState(() => _showAttachMenu = false),
                  ),
                ],
              ),
            ).animate().slideY(begin: 0.3, end: 0),

          // Input Bar
          Container(
            padding: EdgeInsets.fromLTRB(
              16,
              8,
              16,
              MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                  top: BorderSide(color: AppColors.divider, width: 0.5)),
            ),
            child: Row(
              children: [
                // Attachment
                GestureDetector(
                  onTap: () =>
                      setState(() => _showAttachMenu = !_showAttachMenu),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _showAttachMenu
                          ? AppColors.primary.withOpacity(0.2)
                          : AppColors.card,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _showAttachMenu
                          ? Icons.close_rounded
                          : Icons.attach_file_rounded,
                      color: _showAttachMenu
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      size: 20,
                    ),
                  ),
                ),

                const SizedBox(width: 10),

                // Text input
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    style: const TextStyle(
                        color: AppColors.textPrimary, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide:
                            const BorderSide(color: AppColors.primary),
                      ),
                      filled: true,
                      fillColor: AppColors.card,
                    ),
                    maxLines: null,
                    textCapitalization: TextCapitalization.sentences,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),

                const SizedBox(width: 10),

                // Send button
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.send_rounded,
                      color: Colors.black,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool showAvatar;

  const _MessageBubble({required this.message, required this.showAvatar});

  String _formatTime(DateTime dt) {
    final h = dt.hour > 12 ? dt.hour - 12 : dt.hour;
    final m = dt.minute.toString().padLeft(2, '0');
    final amPm = dt.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $amPm';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment:
          message.isSender ? MainAxisAlignment.end : MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (!message.isSender && showAvatar)
          Container(
            width: 28,
            height: 28,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person_rounded,
                color: Colors.black, size: 14),
          )
        else if (!message.isSender)
          const SizedBox(width: 36),

        Flexible(
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.72,
            ),
            padding: message.isLocation
                ? EdgeInsets.zero
                : const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: message.isSender
                  ? AppColors.primary.withOpacity(0.9)
                  : AppColors.card,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(message.isSender ? 18 : 4),
                bottomRight: Radius.circular(message.isSender ? 4 : 18),
              ),
              border: message.isSender
                  ? null
                  : Border.all(color: AppColors.border, width: 0.5),
            ),
            child: message.isLocation
                ? _LocationMessage(isSender: message.isSender)
                : Column(
                    crossAxisAlignment: message.isSender
                        ? CrossAxisAlignment.end
                        : CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.text,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          color: message.isSender
                              ? Colors.black
                              : AppColors.textPrimary,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatTime(message.timestamp),
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 10,
                          color: message.isSender
                              ? Colors.black.withOpacity(0.5)
                              : AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

class _LocationMessage extends StatelessWidget {
  final bool isSender;
  const _LocationMessage({required this.isSender});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      height: 100,
      decoration: BoxDecoration(
        color: isSender
            ? AppColors.primary.withOpacity(0.8)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.location_on_rounded,
              color: isSender ? Colors.black : AppColors.error, size: 28),
          const SizedBox(height: 4),
          Text(
            'Shared Location',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isSender ? Colors.black : AppColors.textPrimary,
            ),
          ),
          Text(
            'Tap to view on map',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 10,
              color: isSender
                  ? Colors.black.withOpacity(0.6)
                  : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttachOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _AttachOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
