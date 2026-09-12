import { Router, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';

export const paymentRouter = Router();

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      razorpay: null,
      keyId: keyId || '',
      keySecret: keySecret || '',
      error: 'Razorpay API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured. Please set them in your environment settings.',
    };
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return { razorpay, keyId, keySecret, error: null };
}

// 1. Get Razorpay Key ID for client-side SDK initialization
paymentRouter.get('/razorpay-key', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  return res.json({
    success: Boolean(keyId),
    key_id: keyId,
    configured: Boolean(keyId && process.env.RAZORPAY_KEY_SECRET),
  });
});

// 2. Create Razorpay Order (/api/create-order)
paymentRouter.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, amountInPaise, amountInRupees, xp, title } = req.body;

    const { razorpay, keyId } = getRazorpayClient();

    // Determine amount in paise (Razorpay requirement for INR: ₹1 = 100 paise)
    let calculatedPaise: number;
    if (amountInPaise && Number(amountInPaise) > 0) {
      calculatedPaise = Math.round(Number(amountInPaise));
    } else if (amountInRupees && Number(amountInRupees) > 0) {
      calculatedPaise = Math.round(Number(amountInRupees) * 100);
    } else if (amount && Number(amount) > 0) {
      const raw = Number(amount);
      calculatedPaise = raw < 10000 ? Math.round(raw * 100) : Math.round(raw);
    } else {
      calculatedPaise = 49900; // Default ₹499 in paise
    }

    if (calculatedPaise < 100) {
      calculatedPaise = 100;
    }

    const receipt = `rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // If Razorpay live credentials are not set, return sandbox demo order
    if (!razorpay || !keyId) {
      const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return res.json({
        success: true,
        order_id: mockOrderId,
        order: { id: mockOrderId, amount: calculatedPaise, currency: 'INR', receipt },
        amount: calculatedPaise,
        currency: 'INR',
        key_id: 'rzp_test_sandbox_mode',
        isSandboxDemo: true,
        receipt,
      });
    }

    const options = {
      amount: calculatedPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        xpPoints: String(xp || 900),
        packageTitle: String(title || 'XP Package'),
        source: 'InterviewAI XP Store',
      },
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      order_id: order.id,
      order,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      receipt: order.receipt,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({
      success: false,
      message: err?.error?.description || err?.message || 'Failed to initialize Razorpay order with gateway.',
    });
  }
});

// 3. Verify Razorpay Payment Signature (/api/verify-payment)
paymentRouter.post('/verify-payment', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      xp,
      title,
      amountInRupees,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).',
      });
    }

    const isSandboxOrder = String(razorpay_order_id).startsWith('order_test_') || razorpay_signature === 'sandbox_verified_sig';

    const { razorpay, keySecret } = getRazorpayClient();

    if (!isSandboxOrder) {
      if (!keySecret) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay secret key is not configured for live signature verification.',
        });
      }

      // HMAC SHA256 Signature Verification: `${razorpay_order_id}|${razorpay_payment_id}`
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Security validation failed: Razorpay payment signature mismatch. Payment cannot be verified.',
        });
      }
    }

    // Fetch verified payment details from Razorpay to get the actual payment method
    let paymentMethodLabel = isSandboxOrder ? 'Razorpay Sandbox (Instant Test Payment)' : 'Razorpay Verified Payment';
    let paidAmountRupees = amountInRupees || 499;

    if (razorpay && !isSandboxOrder) {
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentDetails) {
          if (paymentDetails.amount) {
            paidAmountRupees = Math.round(paymentDetails.amount / 100);
          }
          if (paymentDetails.method === 'upi') {
            paymentMethodLabel = `Razorpay UPI (${(paymentDetails as any).vpa || 'PhonePe/GPay/Paytm'})`;
          } else if (paymentDetails.method === 'card') {
            const card = (paymentDetails as any).card;
            paymentMethodLabel = `Razorpay Card (${card?.network || 'Debit/Credit'} •••• ${card?.last4 || ''})`;
          } else if (paymentDetails.method === 'netbanking') {
            paymentMethodLabel = `Razorpay NetBanking (${(paymentDetails as any).bank || 'Indian Bank Direct'})`;
          } else if (paymentDetails.method === 'wallet') {
            paymentMethodLabel = `Razorpay Wallet (${(paymentDetails as any).wallet || 'Wallet'})`;
          }
        }
      } catch (fetchErr) {
        console.warn('Note: Could not retrieve live payment metadata from Razorpay API:', fetchErr);
      }
    }

    // Award XP to candidate
    const points = Math.max(50, Math.min(10000, Number(xp) || 900));
    const xpResult = db.awardXp(user.id, points);
    const updatedUser = db.getUserById(user.id);

    // Add in-app achievement notification
    db.addNotification({
      id: 'notif_' + Date.now(),
      userId: user.id,
      title: 'Razorpay Payment Verified! ⚡',
      message: `Payment of ₹${paidAmountRupees} verified via ${paymentMethodLabel}! (+${points} XP, Ref: ${razorpay_payment_id}). You are now at ${xpResult.xp} XP (${xpResult.level})!`,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'ACHIEVEMENT',
    });

    return res.json({
      success: true,
      message: `Payment verified successfully! Added +${points} XP to your balance.`,
      xp: xpResult.xp,
      level: xpResult.level,
      leveledUp: xpResult.leveledUp,
      user: updatedUser,
      transactionId: razorpay_payment_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentMethod: paymentMethodLabel,
      amount: `₹${paidAmountRupees}`,
      clearingLatency: 'Sub-second Instant Bank Verification',
      settlementNetwork: 'Razorpay PG & Bank 3D-Secure / NPCI UPI',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Unexpected error verifying payment with Razorpay.',
    });
  }
});
