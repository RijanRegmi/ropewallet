import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import 'settings_page.dart';
import 'saved_card_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _isUploading = false;
  File? _selectedLocalFile;
  final ImagePicker _picker = ImagePicker();

  void _copyUserTag(String userTag) {
    if (userTag.trim().isEmpty) return;
    final formattedTag = userTag.startsWith('\$') ? userTag.trim() : '\$${userTag.trim()}';
    Clipboard.setData(ClipboardData(text: formattedTag));
    HapticFeedback.lightImpact();
    if (mounted) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF10B981),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Copied "$formattedTag" to clipboard!',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _showImageSourceBottomSheet(String profileImage) async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final theme = Theme.of(ctx);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Profile Photo',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildSourceOption(
                      icon: Icons.camera_alt_rounded,
                      label: 'Camera',
                      color: theme.primaryColor,
                      onTap: () {
                        Navigator.of(ctx).pop();
                        _pickAndUploadImage(ImageSource.camera);
                      },
                    ),
                    _buildSourceOption(
                      icon: Icons.photo_library_rounded,
                      label: 'Gallery',
                      color: theme.primaryColor,
                      onTap: () {
                        Navigator.of(ctx).pop();
                        _pickAndUploadImage(ImageSource.gallery);
                      },
                    ),
                    if (profileImage.isNotEmpty || _selectedLocalFile != null)
                      _buildSourceOption(
                        icon: Icons.delete_outline_rounded,
                        label: 'Remove',
                        color: const Color(0xFFEF4444),
                        onTap: () {
                          Navigator.of(ctx).pop();
                          _removeProfileImage();
                        },
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSourceOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Future<void> _removeProfileImage() async {
    setState(() {
      _selectedLocalFile = null;
      _isUploading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.updateProfileImage('');
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF047857),
            content: Text('Profile image removed successfully!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to remove profile image'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Error: $e'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 50,
        maxWidth: 400,
        maxHeight: 400,
      );

      if (image == null) return;

      final file = File(image.path);
      setState(() {
        _selectedLocalFile = file;
        _isUploading = true;
      });

      String? imageUrl;

      // 1. Attempt Cloudinary upload with 6s timeout
      try {
        final timestamp = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        const apiSecret = 'MFRebbkEeGtYMg9LmbDwjaQYz4s';
        const apiKey = '936327183722823';
        const cloudName = 'v41le7lh';
        
        final signatureStr = 'timestamp=$timestamp$apiSecret';
        final signature = sha1.convert(utf8.encode(signatureStr)).toString();

        final url = Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload');
        final request = http.MultipartRequest('POST', url)
          ..fields['api_key'] = apiKey
          ..fields['timestamp'] = timestamp.toString()
          ..fields['signature'] = signature
          ..files.add(await http.MultipartFile.fromPath('file', file.path));

        final streamedResponse = await request.send().timeout(const Duration(seconds: 6));
        final response = await http.Response.fromStream(streamedResponse).timeout(const Duration(seconds: 6));

        if (response.statusCode == 200) {
          final decoded = jsonDecode(response.body);
          imageUrl = decoded['secure_url'] as String;
        }
      } catch (_) {
        // Cloudinary upload unavailable — fallback to base64 encoding below
      }

      // 2. Fallback to base64 data URI if Cloudinary upload was not completed
      if (imageUrl == null || imageUrl.isEmpty) {
        final bytes = await file.readAsBytes();
        imageUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      // 3. Save profile image to backend database & AuthProvider state
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.updateProfileImage(imageUrl);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF047857),
            content: Text('Profile image updated successfully!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else if (mounted) {
        setState(() {
          _selectedLocalFile = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to update profile image'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _selectedLocalFile = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Error: $e'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user ?? {};
    final fullName = user['fullName'] ?? 'RopeWallet User';
    final userTag = user['userTag'] ?? user['username'] ?? '';
    final email = user['email'] ?? '';
    final phone = user['phoneNumber'] ?? '';
    final profileImage = user['profileImage'] ?? '';
    final savedCard = user['savedCard'];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            tooltip: 'Settings',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsPage()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            
            // Circular Avatar Container with upload option
            Center(
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: theme.primaryColor,
                        width: 3.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 64,
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      backgroundImage: _selectedLocalFile != null
                          ? FileImage(_selectedLocalFile!) as ImageProvider
                          : getProfileImageProvider(profileImage),
                      child: (_selectedLocalFile == null && getProfileImageProvider(profileImage) == null)
                          ? Icon(
                              Icons.person_rounded,
                              size: 64,
                              color: isDark ? Colors.white54 : Colors.grey[400],
                            )
                          : null,
                    ),
                  ),
                  if (_isUploading)
                    Positioned.fill(
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                      ),
                    ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: CircleAvatar(
                      backgroundColor: theme.primaryColor,
                      radius: 20,
                      child: IconButton(
                        icon: const Icon(Icons.camera_alt_rounded, size: 18, color: Colors.white),
                        tooltip: 'Profile Photo Options',
                        onPressed: _isUploading ? null : () => _showImageSourceBottomSheet(profileImage),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Profile Welcome Headers
            Text(
              fullName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => _copyUserTag(userTag),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Text(
                  userTag.startsWith('\$') ? userTag : '\$$userTag',
                  style: TextStyle(
                    fontSize: 15,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 36),

            // Profile detail cards
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                children: [
                  _buildProfileRow(
                    Icons.person_outline_rounded,
                    'Full Name',
                    fullName,
                    isDark,
                  ),
                  const SizedBox(height: 16),
                  _buildProfileRow(
                    Icons.alternate_email_rounded,
                    'User Tag',
                    userTag.startsWith('\$') ? userTag : '\$$userTag',
                    isDark,
                    onTap: () => _copyUserTag(userTag),
                  ),
                  const SizedBox(height: 16),
                  _buildProfileRow(
                    Icons.email_outlined,
                    'Email Address',
                    email,
                    isDark,
                  ),
                  const SizedBox(height: 16),
                  _buildProfileRow(
                    Icons.phone_outlined,
                    'Phone Number',
                    phone,
                    isDark,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Settings section
            const Text(
              'Settings & Security',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                ),
              ),
              child: ListTile(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SavedCardPage()),
                  );
                },
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.credit_card_rounded, color: Color(0xFF4F46E5), size: 20),
                ),
                title: const Text('Saved Payment Card', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  savedCard != null && savedCard['last4'] != null
                      ? '${savedCard['cardBrand'] ?? 'Debit Card'} ending in ${savedCard['last4']}'
                      : 'None saved',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value, bool isDark, {VoidCallback? onTap}) {
    final rowChild = Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF4F46E5).withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: const Color(0xFF4F46E5), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (onTap != null) {
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: rowChild,
      );
    }
    return rowChild;
  }
}
