import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { P2PAccount } from '../models/p2p_account.model.js';
import { Transaction } from '../models/transaction.model.js';
import { User } from '../models/user.model.js';

let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;

import { P2POrder } from '../models/p2p_order.model.js';

// Helper to fuzzy match payer names
function fuzzyMatchName(dbName: string, emailName: string): boolean {
  // If no payer name was provided in the database (automated verification), match purely on amount
  if (!dbName) return true;
  if (!emailName) return false;
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const dbClean = clean(dbName);
  const emailClean = clean(emailName);
  
  if (dbClean.length === 0 || emailClean.length === 0) return false;
  return dbClean.includes(emailClean) || emailClean.includes(dbClean);
}

// Regex extraction helper for different platforms
interface ExtractedPayment {
  amount: number;
  senderName: string;
}

function parseEmailBody(platform: string, subject: string, text: string): ExtractedPayment | null {
  const content = `${subject}\n${text}`;
  
  if (platform === 'venmo') {
    // Venmo email format examples:
    // Subject: "John Doe sent you $15.00"
    // Subject: "You received $15.00 from John Doe"
    const regex1 = /([\w\s.\-]+) sent you \$([\d,]+\.\d{2})/i;
    const regex2 = /received \$([\d,]+\.\d{2}) from ([\w\s.\-]+)/i;
    
    let match = content.match(regex1);
    if (match) {
      return {
        senderName: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, '')),
      };
    }
    
    match = content.match(regex2);
    if (match) {
      return {
        amount: parseFloat(match[1].replace(/,/g, '')),
        senderName: match[2].trim(),
      };
    }
  } else if (platform === 'cashapp') {
    // Cash App email format examples:
    // Subject: "John Doe sent you $10 for dinner"
    // Subject: "You received $10.00 from John Doe"
    const regex1 = /([\w\s.\-]+) sent you \$([\d,]+(\.\d{2})?)/i;
    const regex2 = /received \$([\d,]+(\.\d{2})?) from ([\w\s.\-]+)/i;
    
    let match = content.match(regex1);
    if (match) {
      return {
        senderName: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, '')),
      };
    }
    
    match = content.match(regex2);
    if (match) {
      return {
        amount: parseFloat(match[1].replace(/,/g, '')),
        senderName: match[3].trim(),
      };
    }
  } else if (platform === 'chime') {
    // Chime email format examples:
    // Subject: "John Doe sent you $20.00"
    // Subject: "You received $20.00 from John Doe"
    const regex1 = /([\w\s.\-]+) sent you \$([\d,]+\.\d{2})/i;
    const regex2 = /received \$([\d,]+\.\d{2}) from ([\w\s.\-]+)/i;
    
    let match = content.match(regex1);
    if (match) {
      return {
        senderName: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, '')),
      };
    }
    
    match = content.match(regex2);
    if (match) {
      return {
        amount: parseFloat(match[1].replace(/,/g, '')),
        senderName: match[2].trim(),
      };
    }
  }
  
  return null;
}

// Check an individual account's inbox
async function checkAccountInbox(account: any): Promise<void> {
  if (!account.email || !account.appPassword) {
    console.log(`[P2P Auto] Account ${account.platform} (${account.handle}) is missing credentials. Skipping.`);
    return;
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: account.email,
      pass: account.appPassword,
    },
    logger: false,
  });

  try {
    await client.connect();
    
    // Select INBOX
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Find unread messages
      const messages = await client.search({ seen: false });
      
      if (Array.isArray(messages)) {
        for (const uid of messages) {
          // Fetch message source
          const message = await client.fetchOne(uid, { source: true });
        if (!message || !message.source) continue;
        
        // Parse email contents
        const parsed = await simpleParser(message.source);
        const subject = parsed.subject || '';
        const text = parsed.text || '';
        const fromAddress = parsed.from?.value[0]?.address || '';
        
        console.log(`[P2P Auto] New unread email from "${fromAddress}": "${subject}"`);
        
        // Parse the payment information
        const payment = parseEmailBody(account.platform, subject, text);
        if (payment) {
          console.log(`[P2P Auto] Parsed receipt: $${payment.amount} from "${payment.senderName}" on ${account.platform}`);
          
          // 1. Check P2POrder gateway orders first
          const pendingOrders = await P2POrder.find({
            status: 'pending',
            paymentMethod: account.platform,
            amount: payment.amount,
            expiresAt: { $gt: new Date() },
          });

          let matchedOrder = null;
          for (const order of pendingOrders) {
            const cleanSender = payment.senderName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanPayerTag = (order.payerTag || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanPayerName = (order.payerName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            if (
              (cleanPayerTag && (cleanSender.includes(cleanPayerTag) || cleanPayerTag.includes(cleanSender))) ||
              (cleanPayerName && (cleanSender.includes(cleanPayerName) || cleanPayerName.includes(cleanSender))) ||
              (!cleanPayerTag && !cleanPayerName)
            ) {
              matchedOrder = order;
              break;
            }
          }

          if (matchedOrder) {
            console.log(`[P2P Auto] Matched Gateway P2POrder ID ${matchedOrder._id} (Order: ${matchedOrder.orderNo})`);

            matchedOrder.status = 'completed';
            matchedOrder.completedAt = new Date();
            await matchedOrder.save();

            // Credit Host with 85% net split (15% platform commission)
            const host = await User.findById(matchedOrder.hostId);
            if (host) {
              const platformFeeRate = 0.15;
              const netHostCredit = matchedOrder.amount * (1 - platformFeeRate);
              host.walletBalance = (host.walletBalance || 0) + netHostCredit;
              await host.save({ validateBeforeSave: false });
              console.log(`[P2P Auto] Credited Host ${host.fullName} +$${netHostCredit.toFixed(2)} for Order ${matchedOrder.orderNo}`);
            }

            await client.messageFlagsAdd({ uid }, ['\\Seen']);
            continue;
          }

          // 2. Check legacy Transaction records
          const pendingTxns = await Transaction.find({
            status: 'pending',
            type: 'p2p_deposit',
            paymentMethod: account.platform,
            amount: payment.amount
          }).populate('receiver');

          let matchedTxn = null;
          for (const txn of pendingTxns) {
            const dbPayerName = txn.payerInfo?.name || '';
            if (fuzzyMatchName(dbPayerName, payment.senderName)) {
              matchedTxn = txn;
              break;
            }
          }

          if (matchedTxn) {
            console.log(`[P2P Auto] Found matching pending transaction: ID ${matchedTxn._id} for recipient wallet.`);
            
            matchedTxn.status = 'completed';
            matchedTxn.approvedAt = new Date();
            await matchedTxn.save();
            
            const receiver = await User.findById(matchedTxn.receiver);
            if (receiver) {
              receiver.walletBalance = (receiver.walletBalance || 0) + matchedTxn.amount;
              await receiver.save({ validateBeforeSave: false });
              console.log(`[P2P Auto] Instantly credited $${matchedTxn.amount.toFixed(2)} to ${receiver.fullName}.`);
            }
            
            await client.messageFlagsAdd({ uid }, ['\\Seen']);
            console.log(`[P2P Auto] Email marked as Read.`);
          } else {
            console.log(`[P2P Auto] No pending transaction/order found matching amount $${payment.amount} from "${payment.senderName}" on ${account.platform}`);
          }
        }
      }
      }
    } finally {
      lock.release();
    }
    
    await client.logout();
  } catch (error: any) {
    console.error(`[P2P Auto] Error processing inbox for ${account.platform} (${account.email}):`, error.message || error);
    try {
      await client.logout();
    } catch {}
  }
}

// Background poller task
async function pollInboxes(): Promise<void> {
  if (isPolling) return;
  isPolling = true;
  
  try {
    // Find all active P2P accounts with auto-verify enabled
    const accounts = await P2PAccount.find({
      isActive: true,
      isAutoVerifyEnabled: true,
    });
    
    if (accounts.length > 0) {
      console.log(`[P2P Auto] Starting check of ${accounts.length} automated inbox(es)...`);
      for (const account of accounts) {
        await checkAccountInbox(account);
      }
    }
  } catch (error) {
    console.error('[P2P Auto] Failed to poll database for P2P accounts:', error);
  } finally {
    isPolling = false;
  }
}

export function startP2PAutomationService(intervalMs: number = 20000): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  console.log(`[P2P Auto] Starting automatic P2P email verification service (interval: ${intervalMs / 1000}s)...`);
  
  // Run first check immediately after server start
  setTimeout(() => {
    pollInboxes().catch(console.error);
  }, 5000);
  
  pollingInterval = setInterval(() => {
    pollInboxes().catch(console.error);
  }, intervalMs);
}

export function stopP2PAutomationService(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[P2P Auto] Stopped email verification service.');
  }
}
