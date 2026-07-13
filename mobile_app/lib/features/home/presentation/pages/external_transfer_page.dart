import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';

class ExternalTransferPage extends StatefulWidget {
  final String provider;
  final String recipientName;

  const ExternalTransferPage({
    super.key,
    required this.provider,
    required this.recipientName,
  });

  @override
  State<ExternalTransferPage> createState() => _ExternalTransferPageState();
}

class _ExternalTransferPageState extends State<ExternalTransferPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _amountController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submitTransfer() async {
    if (!_formKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_amountController.text.trim());

    final hasPin = authProvider.user?['hasPin'] == true;
    String? pin;

    if (hasPin) {
      pin = await showModalBottomSheet<String>(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        builder: (context) => PinCodeDialog(
          title: 'Enter Transaction PIN',
          subtitle: 'Confirm PIN to send transfer',
        ),
      );

      if (pin == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Transfer canceled')),
        );
        return;
      }
    }

    // Backend automatically creates or generates the target routing & account details based on the recipient tag
    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      bankName: widget.provider,
      recipientTag: widget.recipientName,
      pin: pin,
    );

    if (mounted) {
      if (success) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
                SizedBox(width: 10),
                Text('Transfer Sent'),
              ],
            ),
            content: Text(
              'Successfully sent \$${amount.toStringAsFixed(2)} directly to ${widget.recipientName} on ${widget.provider}!\n\n'
              'All account details were retrieved automatically.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop(); // pop dialog
                  Navigator.of(context).pop(); // pop transfer page
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(walletProvider.errorMessage ?? 'Transfer failed'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final walletProvider = Provider.of<WalletProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    final user = authProvider.user ?? {};
    final double userBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : 0.00;

    return Scaffold(
      appBar: AppBar(
        title: Text('Send to ${widget.provider}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: theme.primaryColor.withOpacity(0.15),
                      child: Icon(Icons.flash_on_rounded, color: theme.primaryColor),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Paying ${widget.provider} Tag',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: theme.primaryColor),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.recipientName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Available Balance
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Available Balance:', style: TextStyle(fontWeight: FontWeight.w500)),
                  Text(
                    '\$${userBalance.toStringAsFixed(2)}',
                    style: TextStyle(fontWeight: FontWeight.bold, color: theme.primaryColor),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Amount Input
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                ],
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Amount to Send (USD)',
                  prefixIcon: const Icon(Icons.attach_money_rounded, size: 30),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter an amount';
                  }
                  final amount = double.tryParse(value);
                  if (amount == null || amount <= 0) {
                    return 'Please enter a valid positive amount';
                  }
                  if (amount > userBalance) {
                    return 'Insufficient balance';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 40),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: walletProvider.isLoading ? null : _submitTransfer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                  ),
                  child: walletProvider.isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          'Send \$${_amountController.text.isEmpty ? '0.00' : double.tryParse(_amountController.text) != null ? double.parse(_amountController.text).toStringAsFixed(2) : '0.00'} to ${widget.provider}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 20),
              const Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.security_rounded, size: 16, color: Colors.grey),
                    SizedBox(width: 6),
                    Text(
                      'Secured instantly via Stripe payout networks',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
