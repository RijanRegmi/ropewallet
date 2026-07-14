import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'receipt_page.dart';

class WithdrawPage extends StatefulWidget {
  const WithdrawPage({super.key});

  @override
  State<WithdrawPage> createState() => _WithdrawPageState();
}

class _WithdrawPageState extends State<WithdrawPage> {
  final _cardFormKey = GlobalKey<FormState>();
  final _bankFormKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  
  // Card Form Fields
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();

  // Additional Billing Fields (Symmetrical to SavedCardPage / DepositPage)
  final _cardholderController = TextEditingController();
  final _addressController = TextEditingController();
  final _zipController = TextEditingController();
  final _invoiceNameController = TextEditingController();
  final _taxIdController = TextEditingController();

  String _selectedCountry = 'United States';
  bool _differentInvoiceName = false;
  bool _agreedToTerms = false;
  bool _isSavingCard = false;
  bool _isInlineEditing = false;

  // Bank Form Fields
  final _routingController = TextEditingController();
  final _accountController = TextEditingController();
  final _holderNameController = TextEditingController();
  String _selectedBankName = 'Chime';
  final _remarksController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    _routingController.dispose();
    _accountController.dispose();
    _holderNameController.dispose();
    _remarksController.dispose();
    _cardholderController.dispose();
    _addressController.dispose();
    _zipController.dispose();
    _invoiceNameController.dispose();
    _taxIdController.dispose();
    super.dispose();
  }

  bool _isValidLuhn(String cardNumber) {
    final cleanNumber = cardNumber.replaceAll(' ', '');
    if (cleanNumber.isEmpty) return false;
    if (cleanNumber == '4242424242424242') return true;

    int sum = 0;
    bool alternate = false;
    for (int i = cleanNumber.length - 1; i >= 0; i--) {
      int n = int.tryParse(cleanNumber[i]) ?? 0;
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 == 0;
  }

  String _formatCardNumber(String rawCard) {
    final text = rawCard.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 4 == 0 && nonZeroIndexValue != text.length) {
        buffer.write(' ');
      }
    }
    return buffer.toString();
  }

  Future<void> _submitWithdrawal(String method) async {
    final String amountText = _amountController.text.trim();
    if (amountText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount')),
      );
      return;
    }
    final double? amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid positive amount')),
      );
      return;
    }
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user ?? {};
    final double userBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : 0.00;
    if (amount > userBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insufficient balance')),
      );
      return;
    }

    final savedCard = authProvider.user?['savedCard'];
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

    // Validate forms
    if (method == 'bank') {
      if (!_bankFormKey.currentState!.validate()) return;
    } else {
      final bool needsSaveCard = !hasSavedCard || _isInlineEditing;
      if (needsSaveCard) {
        if (!_cardFormKey.currentState!.validate()) return;
        if (!_agreedToTerms) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please agree to the storage terms to proceed.')),
          );
          return;
        }
      } else {
        if (!_cardFormKey.currentState!.validate()) return;
      }
    }

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to complete withdrawal',
      ),
    );

    if (pin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Withdrawal canceled')),
      );
      return;
    }

    bool success = false;
    final String customRemarks = _remarksController.text.trim();
    String remarksText = '';
    String receiverName = '';

    if (method == 'bank') {
      final routing = _routingController.text.trim();
      remarksText = customRemarks.isNotEmpty ? customRemarks : 'Withdrawal to $_selectedBankName Bank Account (routing: ...${routing.length >= 4 ? routing.substring(routing.length - 4) : ''})';
      receiverName = '$_selectedBankName Bank Account';

      success = await walletProvider.withdraw(
        amount: amount,
        method: 'bank',
        authProvider: authProvider,
        routingNumber: routing,
        accountNumber: _accountController.text.trim(),
        bankName: _selectedBankName,
        accountHolderName: _holderNameController.text.trim(),
        pin: pin,
        remarks: remarksText,
      );
    } else {
      // Step 1: Save card if needed
      final bool needsSaveCard = !hasSavedCard || _isInlineEditing;
      if (needsSaveCard) {
        setState(() {
          _isSavingCard = true;
        });

        final expiryParts = _expiryController.text.split('/');
        final saveSuccess = await authProvider.saveCard(
          cardholderName: _cardholderController.text.trim(),
          cardNumber: _cardNumberController.text.trim(),
          expMonth: expiryParts[0].trim(),
          expYear: '20${expiryParts[1].trim()}',
          cvc: _cvcController.text.trim(),
          zipCode: _zipController.text.trim(),
          country: _selectedCountry,
          addressLine1: _addressController.text.trim(),
          differentInvoiceName: _differentInvoiceName,
          invoiceName: _differentInvoiceName ? _invoiceNameController.text.trim() : '',
          taxId: _taxIdController.text.trim(),
        );

        setState(() {
          _isSavingCard = false;
          if (saveSuccess) {
            _isInlineEditing = false;
          }
        });

        if (!saveSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text(authProvider.errorMessage ?? 'Failed to save payment card details'),
            ),
          );
          return;
        }
      }

      // Step 2: Perform Instant Withdrawal using saved card
      final updatedSavedCard = authProvider.user?['savedCard'];
      final cardBrand = updatedSavedCard?['cardBrand'] ?? 'Debit Card';
      final cardLast4 = updatedSavedCard?['last4'] ?? '4242';
      remarksText = customRemarks.isNotEmpty ? customRemarks : 'Withdrawal to $cardBrand ending in $cardLast4';
      receiverName = cardBrand;

      success = await walletProvider.withdraw(
        amount: amount,
        method: 'card',
        authProvider: authProvider,
        pin: pin,
        remarks: remarksText,
        useSavedCard: true,
      );
    }

    if (mounted) {
      if (success) {
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'transfer',
          'amount': amount,
          'fee': 0.0,
          'netAmount': amount,
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': receiverName},
        };

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ReceiptPage(
              transaction: newTx,
              currentUser: authProvider.user ?? {},
              isNewTransferSuccess: true,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(walletProvider.errorMessage ?? 'Withdrawal failed'),
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

    final savedCard = user['savedCard'];
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Withdraw Funds'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.credit_card_rounded), text: 'Instant Card Payout'),
              Tab(icon: Icon(Icons.account_balance_rounded), text: 'Bank Account Transfer'),
            ],
          ),
        ),
        body: Builder(
          builder: (context) {
            final tabController = DefaultTabController.of(context);
            return AnimatedBuilder(
              animation: tabController,
              builder: (context, _) {
                final isCardTab = tabController.index == 0;
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Balance Indicator
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Text('Available Balance: ', style: TextStyle(fontWeight: FontWeight.w500)),
                              GestureDetector(
                                onTap: () {
                                  walletProvider.toggleBalanceVisibility();
                                },
                                child: Icon(
                                  walletProvider.isBalanceHidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  size: 16,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            walletProvider.isBalanceHidden ? '\$xxxx.xx' : '\$${userBalance.toStringAsFixed(2)}',
                            style: TextStyle(fontWeight: FontWeight.bold, color: theme.primaryColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Amount Input
                      TextFormField(
                        controller: _amountController,
                        autovalidateMode: AutovalidateMode.onUserInteraction,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                        ],
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Withdrawal Amount (USD)',
                          prefixIcon: const Icon(Icons.attach_money_rounded, size: 28),
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
                      const SizedBox(height: 24),

                      // Dynamic Tab Content rendered Inline to prevent nested scroll views
                      if (isCardTab)
                        Form(
                          key: _cardFormKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!hasSavedCard || _isInlineEditing) ...[
                                // Symmetrical saved card form
                                const Text('Payment method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 12),
                                const Text('Full name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _cardholderController,
                                  textCapitalization: TextCapitalization.words,
                                  decoration: InputDecoration(
                                    hintText: 'Rijan Regmi',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Full name is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                const Text('Country or region', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  value: _selectedCountry,
                                  decoration: InputDecoration(
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  items: ['United States', 'Canada', 'United Kingdom'].map((country) {
                                    return DropdownMenuItem<String>(
                                      value: country,
                                      child: Text(country),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedCountry = val;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 14),

                                const Text('Address line 1', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _addressController,
                                  textCapitalization: TextCapitalization.words,
                                  decoration: InputDecoration(
                                    hintText: 'Street address, P.O. box',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Address is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                const Text('Billing Zip / Postal Code', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _zipController,
                                  textCapitalization: TextCapitalization.characters,
                                  decoration: InputDecoration(
                                    hintText: 'e.g. 90210',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Zip code is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                const Text('Card number', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _cardNumberController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.allow(RegExp(r'[0-9 ]')),
                                    LengthLimitingTextInputFormatter(19),
                                    CardNumberFormatter(),
                                  ],
                                  decoration: InputDecoration(
                                    hintText: '1234 5678 1234 5678',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    suffixIcon: Container(
                                      width: 120,
                                      padding: const EdgeInsets.only(right: 8.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Image.network('https://img.icons8.com/color/48/000000/visa.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Visa')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/mastercard.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('MC')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/amex.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Amex')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/discover.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Disc')),
                                        ],
                                      ),
                                    ),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Card number is required';
                                    if (!_isValidLuhn(value)) return 'Invalid card format';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Expiration date', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _expiryController,
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [
                                              FilteringTextInputFormatter.allow(RegExp(r'[0-9/]')),
                                              LengthLimitingTextInputFormatter(5),
                                              CardExpiryFormatter(),
                                            ],
                                            decoration: InputDecoration(
                                              hintText: 'MM / YY',
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                            ),
                                            validator: (value) {
                                              if (hasSavedCard && !_isInlineEditing) return null;
                                              if (value == null || value.trim().isEmpty) return 'Required';
                                              final parts = value.split('/');
                                              if (parts.length != 2) return 'MM/YY';
                                              final month = int.tryParse(parts[0]);
                                              if (month == null || month < 1 || month > 12) return '1-12';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Security code', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _cvcController,
                                            keyboardType: TextInputType.number,
                                            obscureText: true,
                                            inputFormatters: [
                                              FilteringTextInputFormatter.digitsOnly,
                                              LengthLimitingTextInputFormatter(4),
                                            ],
                                            decoration: InputDecoration(
                                              hintText: 'CVC',
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                              suffixIcon: const Icon(Icons.lock_rounded, size: 16),
                                            ),
                                            validator: (value) {
                                              if (hasSavedCard && !_isInlineEditing) return null;
                                              if (value == null || value.trim().length < 3) return 'Required';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),

                                Row(
                                  children: [
                                    Checkbox(
                                      value: _differentInvoiceName,
                                      onChanged: (val) {
                                        setState(() {
                                          _differentInvoiceName = val ?? false;
                                        });
                                      },
                                    ),
                                    const Text('Use a different name on invoices', style: TextStyle(fontSize: 12)),
                                  ],
                                ),
                                if (_differentInvoiceName) ...[
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _invoiceNameController,
                                    textCapitalization: TextCapitalization.words,
                                    decoration: InputDecoration(
                                      hintText: 'Invoice name (e.g. Business Name)',
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    ),
                                    validator: (value) {
                                      if (hasSavedCard && !_isInlineEditing) return null;
                                      if (_differentInvoiceName && (value == null || value.trim().isEmpty)) return 'Invoice name required';
                                      return null;
                                    },
                                  ),
                                ],
                                const SizedBox(height: 14),

                                const Text('Business tax ID (Optional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 4),
                                Text(
                                  'If you provide a tax ID, the "Full name" above should be your business\'s name.',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const SizedBox(
                                      width: 110,
                                      child: Text('US SSN / EIN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                    ),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _taxIdController,
                                        keyboardType: TextInputType.text,
                                        decoration: InputDecoration(
                                          hintText: '12-3456789',
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 18),

                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Checkbox(
                                      value: _agreedToTerms,
                                      onChanged: (val) {
                                        setState(() {
                                          _agreedToTerms = val ?? false;
                                        });
                                      },
                                    ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.only(top: 8.0),
                                        child: Text(
                                          'You agree that RopeWallet will securely store and verify this payment card for deposit and withdrawal purposes under our user terms.',
                                          style: TextStyle(color: Colors.grey[600], fontSize: 11, height: 1.4),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),

                                if (_isInlineEditing) ...[
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () {
                                            setState(() {
                                              _isInlineEditing = false;
                                            });
                                          },
                                          style: OutlinedButton.styleFrom(
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            padding: const EdgeInsets.symmetric(vertical: 16),
                                          ),
                                          child: const Text('Cancel Edit'),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        flex: 2,
                                        child: ElevatedButton(
                                          onPressed: _isSavingCard ? null : () => _submitWithdrawal('card'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: theme.primaryColor,
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            padding: const EdgeInsets.symmetric(vertical: 16),
                                          ),
                                          child: _isSavingCard
                                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                              : const Text('Update Saved Card', style: TextStyle(fontWeight: FontWeight.bold)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ] else ...[
                                  SizedBox(
                                    width: double.infinity,
                                    height: 52,
                                    child: ElevatedButton(
                                      onPressed: _isSavingCard ? null : () => _submitWithdrawal('card'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: theme.primaryColor,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: _isSavingCard
                                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                          : const Text('Confirm & Save Card', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ],
                              ] else ...[
                                // Collapsed saved card details
                                Container(
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        theme.primaryColor.withOpacity(0.85),
                                        theme.primaryColor.withBlue(220).withOpacity(0.85),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.credit_card_rounded, color: Colors.white, size: 28),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              savedCard['cardBrand'] ?? 'Saved Card',
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '•••• •••• •••• ${savedCard['last4']}',
                                              style: const TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1.0),
                                            ),
                                          ],
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          setState(() {
                                            _isInlineEditing = true;
                                            _cardholderController.text = savedCard['cardholderName'] ?? '';
                                            _cardNumberController.text = _formatCardNumber(savedCard['cardNumber'] ?? '');
                                            _expiryController.text = '${savedCard['expMonth']}/${(savedCard['expYear'] ?? '').toString().substring(2)}';
                                            _cvcController.text = savedCard['cvc'] ?? '';
                                            _zipController.text = savedCard['zipCode'] ?? '';
                                            _selectedCountry = savedCard['country'] ?? 'United States';
                                            _addressController.text = savedCard['addressLine1'] ?? '';
                                            _differentInvoiceName = savedCard['differentInvoiceName'] ?? false;
                                            _invoiceNameController.text = savedCard['invoiceName'] ?? '';
                                            _taxIdController.text = savedCard['taxId'] ?? '';
                                            _agreedToTerms = true;
                                          });
                                        },
                                        child: const Text('Edit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _remarksController,
                                  autovalidateMode: AutovalidateMode.onUserInteraction,
                                  textCapitalization: TextCapitalization.sentences,
                                  decoration: InputDecoration(
                                    labelText: 'Remarks',
                                    prefixIcon: const Icon(Icons.edit_note_rounded, size: 24),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: 'e.g. Cash out to card',
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Remarks are required';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 28),

                                SizedBox(
                                  width: double.infinity,
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: walletProvider.isLoading ? null : () => _submitWithdrawal('card'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: theme.primaryColor,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: walletProvider.isLoading
                                        ? const CircularProgressIndicator(color: Colors.white)
                                        : const Text('Confirm Instant Card Cash Out', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        )
                      else
                        Form(
                          key: _bankFormKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Bank Routing & Account Details:',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                value: _selectedBankName,
                                decoration: InputDecoration(
                                  labelText: 'Select Bank',
                                  prefixIcon: const Icon(Icons.business_rounded),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                items: ['Chime', 'Venmo', 'Chase', 'Wells Fargo', 'Bank of America', 'PNC Bank']
                                    .map((bank) => DropdownMenuItem(value: bank, child: Text(bank)))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _selectedBankName = val;
                                    });
                                  }
                                },
                              ),
                              const SizedBox(height: 18),
                              TextFormField(
                                controller: _holderNameController,
                                autovalidateMode: AutovalidateMode.onUserInteraction,
                                textCapitalization: TextCapitalization.words,
                                decoration: InputDecoration(
                                  labelText: 'Account Holder Name',
                                  prefixIcon: const Icon(Icons.person_outline_rounded),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                  hintText: 'John Doe',
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Account holder name is required';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),
                              TextFormField(
                                controller: _routingController,
                                autovalidateMode: AutovalidateMode.onUserInteraction,
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(9),
                                ],
                                decoration: InputDecoration(
                                  labelText: 'Routing Number',
                                  prefixIcon: const Icon(Icons.tag_rounded),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                  hintText: '9-digit routing number',
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().length != 9) {
                                    return 'Please enter valid 9-digit routing number';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),
                              TextFormField(
                                controller: _accountController,
                                autovalidateMode: AutovalidateMode.onUserInteraction,
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(17),
                                ],
                                decoration: InputDecoration(
                                  labelText: 'Account Number',
                                  prefixIcon: const Icon(Icons.account_balance_wallet_rounded),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                  hintText: 'Account number',
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().length < 4) {
                                    return 'Please enter valid account number';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),
                              TextFormField(
                                controller: _remarksController,
                                autovalidateMode: AutovalidateMode.onUserInteraction,
                                textCapitalization: TextCapitalization.sentences,
                                decoration: InputDecoration(
                                  labelText: 'Remarks',
                                  prefixIcon: const Icon(Icons.edit_note_rounded, size: 24),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                  hintText: 'e.g. Cash out to bank',
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Remarks are required';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 36),
                              SizedBox(
                                width: double.infinity,
                                height: 54,
                                child: ElevatedButton(
                                  onPressed: walletProvider.isLoading ? null : () => _submitWithdrawal('bank'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: theme.primaryColor,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: walletProvider.isLoading
                                      ? const CircularProgressIndicator(color: Colors.white)
                                      : const Text('Confirm Instant Bank Payout', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

// Helpers
class CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 4 == 0 && nonZeroIndexValue != text.length) {
        buffer.write(' ');
      }
    }
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

class CardExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text.replaceAll('/', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 2 == 0 && nonZeroIndexValue != text.length) {
        buffer.write('/');
      }
    }
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
