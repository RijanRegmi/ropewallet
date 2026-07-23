import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../auth/presentation/pages/create_user_page.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';

class AdminPortalPage extends StatefulWidget {
  const AdminPortalPage({super.key});

  @override
  State<AdminPortalPage> createState() => _AdminPortalPageState();
}

class _AdminPortalPageState extends State<AdminPortalPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiClient _apiClient = ApiClient();

  // Overview Tab State
  bool _isLoadingDashboard = true;
  Map<String, dynamic>? _dashboardData;
  String? _dashboardError;

  // Users Tab State
  bool _isLoadingUsers = true;
  List<dynamic> _adminUsers = [];
  List<dynamic> _regularUsers = [];
  String _userSearchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // Deposits Tab State
  bool _isLoadingDeposits = true;
  List<dynamic> _pendingDeposits = [];

  // P2P Accounts Tab State
  bool _isLoadingP2pAccounts = true;
  List<dynamic> _p2pAccounts = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAllAdminData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAllAdminData() async {
    _fetchDashboardData();
    _fetchUsersData();
    _fetchPendingDeposits();
    _fetchP2pAccounts();
  }

  // ─── Data Fetching Methods ──────────────────────────────────────────

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoadingDashboard = true);
    try {
      final res = await _apiClient.get('/admin/dashboard-data');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _dashboardData = data['data'];
          _dashboardError = null;
        });
      } else {
        setState(() => _dashboardError = data['error'] ?? 'Failed to load dashboard data');
      }
    } catch (e) {
      setState(() => _dashboardError = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _isLoadingDashboard = false);
    }
  }

  Future<void> _fetchUsersData() async {
    setState(() => _isLoadingUsers = true);
    try {
      final endpoint = '/admin/users?limit=50&search=${Uri.encodeComponent(_userSearchQuery)}';
      final res = await _apiClient.get(endpoint);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _adminUsers = data['data']['admins'] ?? [];
          _regularUsers = data['data']['users'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching users: $e');
    } finally {
      setState(() => _isLoadingUsers = false);
    }
  }

  Future<void> _fetchPendingDeposits() async {
    setState(() => _isLoadingDeposits = true);
    try {
      final res = await _apiClient.get('/admin/deposits');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _pendingDeposits = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching deposits: $e');
    } finally {
      setState(() => _isLoadingDeposits = false);
    }
  }

  Future<void> _fetchP2pAccounts() async {
    setState(() => _isLoadingP2pAccounts = true);
    try {
      final res = await _apiClient.get('/admin/p2p-accounts');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _p2pAccounts = data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching P2P accounts: $e');
    } finally {
      setState(() => _isLoadingP2pAccounts = false);
    }
  }

  // ─── PIN Prompt Security Helper ────────────────────────────────────

  Future<bool> _verifyPinPrompt(String title) async {
    final pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: title,
        subtitle: 'Security authorization required',
      ),
    );
    return pin != null;
  }

  // ─── User Action Methods ───────────────────────────────────────────

  Future<void> _toggleFreezeUser(String userId, bool isCurrentlyFrozen) async {
    final endpoint = isCurrentlyFrozen
        ? '/admin/users/$userId/unfreeze'
        : '/admin/users/$userId/freeze';

    try {
      final res = await _apiClient.put(endpoint);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isCurrentlyFrozen ? 'Account unfrozen' : 'Account frozen'),
            backgroundColor: isCurrentlyFrozen ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
          ),
        );
        _fetchUsersData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Action failed'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
      );
    }
  }

  Future<void> _deleteUser(String userId, String userName) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isSuperAdmin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Only Super Admins can delete accounts'), backgroundColor: Color(0xFFEF4444)),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: Text('Are you sure you want to permanently delete $userName? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final pinOk = await _verifyPinPrompt('Confirm Delete Account');
    if (!pinOk) return;

    try {
      final res = await _apiClient.delete('/admin/users/$userId');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User account deleted successfully'), backgroundColor: Color(0xFF10B981)),
        );
        _fetchUsersData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Failed to delete user'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
      );
    }
  }

  void _showAdjustBalanceDialog(Map<String, dynamic> user) {
    final balanceController = TextEditingController();
    String type = 'add';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('Adjust Balance for ${user['fullName'] ?? user['firstName']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Balance: \$${(user['walletBalance'] ?? 0.00).toStringAsFixed(2)}'),
              const SizedBox(height: 16),
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('Add Funds'),
                    selected: type == 'add',
                    onSelected: (sel) => setDialogState(() => type = 'add'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Deduct Funds'),
                    selected: type == 'deduct',
                    onSelected: (sel) => setDialogState(() => type = 'deduct'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: balanceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Amount (USD)',
                  prefixText: '\$ ',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(balanceController.text);
                if (amt == null || amt <= 0) return;

                Navigator.pop(context);
                final pinOk = await _verifyPinPrompt('Confirm Balance Adjustment');
                if (!pinOk) return;

                final currentBal = (user['walletBalance'] as num?)?.toDouble() ?? 0.00;
                final newBal = type == 'add' ? currentBal + amt : currentBal - amt;

                try {
                  final res = await _apiClient.put(
                    '/admin/users/${user['_id']}',
                    {'walletBalance': newBal < 0 ? 0.00 : newBal},
                  );
                  final data = jsonDecode(res.body);
                  if (res.statusCode == 200 && data['success'] == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Balance updated successfully'), backgroundColor: Color(0xFF10B981)),
                    );
                    _fetchUsersData();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(data['error'] ?? 'Update failed'), backgroundColor: const Color(0xFFEF4444)),
                    );
                  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
                  );
                }
              },
              child: const Text('Update'),
            ),
          ],
        ),
      ),
    );
  }

  void _showChangeRoleDialog(Map<String, dynamic> user) {
    String selectedRole = user['role'] ?? 'user';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('Change Role for ${user['fullName'] ?? user['firstName']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: const Text('User'),
                value: 'user',
                groupValue: selectedRole,
                onChanged: (val) => setDialogState(() => selectedRole = val!),
              ),
              RadioListTile<String>(
                title: const Text('Admin'),
                value: 'admin',
                groupValue: selectedRole,
                onChanged: (val) => setDialogState(() => selectedRole = val!),
              ),
              RadioListTile<String>(
                title: const Text('Super Admin'),
                value: 'superadmin',
                groupValue: selectedRole,
                onChanged: (val) => setDialogState(() => selectedRole = val!),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                final pinOk = await _verifyPinPrompt('Confirm Role Change');
                if (!pinOk) return;

                try {
                  final res = await _apiClient.put(
                    '/admin/users/${user['_id']}/role',
                    {'role': selectedRole},
                  );
                  final data = jsonDecode(res.body);
                  if (res.statusCode == 200 && data['success'] == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Role updated to ${selectedRole.toUpperCase()}'), backgroundColor: const Color(0xFF10B981)),
                    );
                    _fetchUsersData();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(data['error'] ?? 'Role change failed'), backgroundColor: const Color(0xFFEF4444)),
                    );
                  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
                  );
                }
              },
              child: const Text('Update Role'),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Deposit Action Methods ────────────────────────────────────────

  Future<void> _approveDeposit(String depositId) async {
    final pinOk = await _verifyPinPrompt('Confirm Deposit Approval');
    if (!pinOk) return;

    try {
      final res = await _apiClient.put('/admin/deposits/$depositId/approve');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Deposit approved & funds credited'), backgroundColor: Color(0xFF10B981)),
        );
        _fetchPendingDeposits();
        _fetchDashboardData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Approval failed'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
      );
    }
  }

  Future<void> _declineDeposit(String depositId) async {
    final reasonController = TextEditingController();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Decline Deposit'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(labelText: 'Reason for decline (Optional)', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Decline Request', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final res = await _apiClient.put(
        '/admin/deposits/$depositId/decline',
        {'reason': reasonController.text.trim()},
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Deposit request declined'), backgroundColor: Color(0xFFF59E0B)),
        );
        _fetchPendingDeposits();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Decline failed'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
      );
    }
  }

  // ─── P2P Account Action Methods ────────────────────────────────────

  void _showAddP2pAccountDialog() {
    final handleController = TextEditingController();
    final emailController = TextEditingController();
    final passController = TextEditingController();
    final qrController = TextEditingController();
    String platform = 'chime';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add P2P Deposit Account'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: platform,
                  decoration: const InputDecoration(labelText: 'Platform', border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'chime', child: Text('Chime')),
                    DropdownMenuItem(value: 'cashapp', child: Text('Cash App')),
                    DropdownMenuItem(value: 'venmo', child: Text('Venmo')),
                    DropdownMenuItem(value: 'bank', child: Text('Bank')),
                    DropdownMenuItem(value: 'usdt', child: Text('USDT')),
                  ],
                  onChanged: (val) => setDialogState(() => platform = val ?? 'chime'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: handleController,
                  decoration: const InputDecoration(labelText: 'Handle / Tag / Address', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: emailController,
                  decoration: const InputDecoration(labelText: 'Notification Email', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'App Password (Optional)', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: qrController,
                  decoration: const InputDecoration(labelText: 'QR Code Image URL (Optional)', border: OutlineInputBorder()),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (handleController.text.trim().isEmpty) return;
                Navigator.pop(context);

                try {
                  final res = await _apiClient.post('/admin/p2p-accounts', {
                    'platform': platform,
                    'handle': handleController.text.trim(),
                    'email': emailController.text.trim(),
                    'appPassword': passController.text.trim(),
                    'qrCodeUrl': qrController.text.trim(),
                  });
                  final data = jsonDecode(res.body);
                  if (res.statusCode == 201 && data['success'] == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('P2P Account added successfully'), backgroundColor: Color(0xFF10B981)),
                    );
                    _fetchP2pAccounts();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(data['error'] ?? 'Failed to add P2P account'), backgroundColor: const Color(0xFFEF4444)),
                    );
                  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
                  );
                }
              },
              child: const Text('Add Account'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteP2pAccount(String id) async {
    try {
      final res = await _apiClient.delete('/admin/p2p-accounts/$id');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('P2P Account deleted'), backgroundColor: Color(0xFF10B981)),
        );
        _fetchP2pAccounts();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error'] ?? 'Delete failed'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)),
      );
    }
  }

  // ─── UI Build Methods ───────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isSuperAdmin = authProvider.isSuperAdmin;

    // Regular Admins only see their created users list (no overview, deposits, or p2p accounts tabs)
    if (!isSuperAdmin) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Row(
            children: [
              Icon(Icons.badge_outlined, color: Color(0xFF4F46E5)),
              SizedBox(width: 8),
              Text('Agent Admin — My Users'),
            ],
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: _buildUsersTab(isDark, theme, authProvider),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const CreateUserPage()),
            ).then((_) => _fetchUsersData());
          },
          backgroundColor: theme.primaryColor,
          icon: const Icon(Icons.person_add_alt_1_rounded, color: Colors.white),
          label: const Text('Create User', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.admin_panel_settings_rounded, color: Color(0xFF4F46E5)),
            SizedBox(width: 8),
            Text('Super Admin Portal'),
          ],
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: theme.primaryColor,
          unselectedLabelColor: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          indicatorColor: theme.primaryColor,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard_outlined), text: 'Overview'),
            Tab(icon: Icon(Icons.people_alt_outlined), text: 'Users'),
            Tab(icon: Icon(Icons.pending_actions_outlined), text: 'Deposits'),
            Tab(icon: Icon(Icons.account_balance_wallet_outlined), text: 'P2P Accounts'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(isDark, theme),
          _buildUsersTab(isDark, theme, authProvider),
          _buildDepositsTab(isDark, theme),
          _buildP2pTab(isDark, theme),
        ],
      ),
      floatingActionButton: _tabController.index == 1
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateUserPage()),
                ).then((_) => _fetchUsersData());
              },
              backgroundColor: theme.primaryColor,
              icon: const Icon(Icons.person_add_alt_1_rounded, color: Colors.white),
              label: const Text('Create User', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
    );
  }

  // ─── 1. Overview Tab ────────────────────────────────────────────────

  Widget _buildOverviewTab(bool isDark, ThemeData theme) {
    if (_isLoadingDashboard) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_dashboardError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_dashboardError!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 16)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _fetchDashboardData, child: const Text('Retry')),
          ],
        ),
      );
    }

    final stats = _dashboardData ?? {};
    final recentTx = (stats['recentTransactions'] as List<dynamic>?) ?? [];

    return RefreshIndicator(
      onRefresh: _fetchDashboardData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Stat Cards Grid
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildStatCard('Total Cash Flow', '\$${(stats['totalCashFlow'] ?? 0.0).toStringAsFixed(2)}', Icons.trending_up_rounded, const Color(0xFF3B82F6), isDark),
              _buildStatCard('Platform Revenue', '\$${(stats['totalPlatformFee'] ?? 0.0).toStringAsFixed(2)}', Icons.payments_outlined, const Color(0xFF10B981), isDark),
              _buildStatCard('Stripe Fees Paid', '\$${(stats['totalStripeFee'] ?? 0.0).toStringAsFixed(2)}', Icons.credit_card_off_outlined, const Color(0xFFEF4444), isDark),
              _buildStatCard('Net Profit', '\$${(stats['totalNetProfit'] ?? 0.0).toStringAsFixed(2)}', Icons.savings_outlined, const Color(0xFF8B5CF6), isDark),
              _buildStatCard('Total Users', '${stats['totalUsers'] ?? 0}', Icons.people_outline, const Color(0xFF0EA5E9), isDark),
              _buildStatCard('Pending Deposits', '${stats['pendingDeposits'] ?? 0}', Icons.hourglass_empty_rounded, const Color(0xFFF59E0B), isDark),
            ],
          ),
          const SizedBox(height: 24),

          // Recent Activity Header
          Text('Recent Platform Transactions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          if (recentTx.isEmpty)
            const Center(child: Text('No recent transactions found.', style: TextStyle(color: Colors.grey)))
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recentTx.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final tx = recentTx[index];
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (tx['type'] ?? 'transaction').toString().toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Status: ${tx['status'] ?? 'completed'}',
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ],
                      ),
                      Text(
                        '\$${(tx['amount'] ?? 0.0).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF10B981)),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color accentColor, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accentColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: accentColor),
              const SizedBox(width: 6),
              Expanded(child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: accentColor)),
        ],
      ),
    );
  }

  // ─── 2. Users Tab ──────────────────────────────────────────────────

  Widget _buildUsersTab(bool isDark, ThemeData theme, AuthProvider authProvider) {
    final allUsers = [..._adminUsers, ..._regularUsers];

    return RefreshIndicator(
      onRefresh: _fetchUsersData,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users by name, email, tag...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _userSearchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _userSearchQuery = '');
                          _fetchUsersData();
                        },
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onSubmitted: (val) {
                setState(() => _userSearchQuery = val.trim());
                _fetchUsersData();
              },
            ),
          ),
          Expanded(
            child: _isLoadingUsers
                ? const Center(child: CircularProgressIndicator())
                : allUsers.isEmpty
                    ? const Center(child: Text('No users found.'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: allUsers.length,
                        itemBuilder: (context, index) {
                          final u = allUsers[index];
                          final role = u['role'] ?? 'user';
                          final isFrozen = u['isFrozen'] == true;

                          Color roleColor = Colors.grey;
                          if (role == 'superadmin') roleColor = const Color(0xFFEF4444);
                          if (role == 'admin') roleColor = const Color(0xFF8B5CF6);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: isFrozen ? Border.all(color: const Color(0xFFEF4444), width: 1.5) : null,
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: roleColor.withOpacity(0.15),
                                child: Text(
                                  (u['firstName'] ?? 'U')[0].toUpperCase(),
                                  style: TextStyle(fontWeight: FontWeight.bold, color: roleColor),
                                ),
                              ),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      u['fullName'] ?? '${u['firstName']} ${u['lastName']}',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: roleColor.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      role.toUpperCase(),
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: roleColor),
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Text('${u['userTag']} • ${u['email']}\nBalance: \$${(u['walletBalance'] ?? 0.0).toStringAsFixed(2)}'),
                              isThreeLine: true,
                              trailing: PopupMenuButton<String>(
                                onSelected: (action) {
                                  if (action == 'freeze') _toggleFreezeUser(u['_id'], isFrozen);
                                  if (action == 'balance') _showAdjustBalanceDialog(u);
                                  if (action == 'role') _showChangeRoleDialog(u);
                                  if (action == 'delete') _deleteUser(u['_id'], u['fullName'] ?? u['firstName']);
                                },
                                itemBuilder: (context) => [
                                  PopupMenuItem(
                                    value: 'freeze',
                                    child: Text(isFrozen ? 'Unfreeze Account' : 'Freeze Account'),
                                  ),
                                  const PopupMenuItem(
                                    value: 'balance',
                                    child: Text('Adjust Balance'),
                                  ),
                                  if (authProvider.isSuperAdmin && u['_id'] != authProvider.user?['id']) ...[
                                    const PopupMenuItem(
                                      value: 'role',
                                      child: Text('Change Role'),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Text('Delete Account', style: TextStyle(color: Color(0xFFEF4444))),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  // ─── 3. Deposits Tab ───────────────────────────────────────────────

  Widget _buildDepositsTab(bool isDark, ThemeData theme) {
    return RefreshIndicator(
      onRefresh: _fetchPendingDeposits,
      child: _isLoadingDeposits
          ? const Center(child: CircularProgressIndicator())
          : _pendingDeposits.isEmpty
              ? const Center(child: Text('No pending deposits requiring approval.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pendingDeposits.length,
                  itemBuilder: (context, index) {
                    final dep = _pendingDeposits[index];
                    final user = dep['receiver'] ?? dep['sender'] ?? {};

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                user['fullName'] ?? 'User Request',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Text(
                                '\$${(dep['amount'] ?? 0.0).toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF10B981)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('Method: ${dep['paymentMethod'] ?? 'P2P Transfer'}', style: const TextStyle(color: Colors.grey)),
                          if (dep['remarks'] != null) ...[
                            const SizedBox(height: 4),
                            Text('Note: ${dep['remarks']}', style: const TextStyle(fontStyle: FontStyle.italic)),
                          ],
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
                                  onPressed: () => _declineDeposit(dep['_id']),
                                  child: const Text('Decline'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white),
                                  onPressed: () => _approveDeposit(dep['_id']),
                                  child: const Text('Approve & Credit'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  // ─── 4. P2P Accounts Tab ───────────────────────────────────────────

  Widget _buildP2pTab(bool isDark, ThemeData theme) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddP2pAccountDialog,
        backgroundColor: theme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchP2pAccounts,
        child: _isLoadingP2pAccounts
            ? const Center(child: CircularProgressIndicator())
            : _p2pAccounts.isEmpty
                ? const Center(child: Text('No active receiving accounts. Click + to add.'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _p2pAccounts.length,
                    itemBuilder: (context, index) {
                      final acc = _p2pAccounts[index];
                      final platform = (acc['platform'] ?? 'chime').toString().toUpperCase();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(platform, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                                const SizedBox(height: 4),
                                Text('Handle: ${acc['handle'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                                if (acc['email'] != null && acc['email'].toString().isNotEmpty)
                                  Text('Email: ${acc['email']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444)),
                              onPressed: () => _deleteP2pAccount(acc['_id']),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
