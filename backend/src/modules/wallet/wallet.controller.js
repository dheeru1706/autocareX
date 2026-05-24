const db = require('../../config/database');
const { createOrder, verifySignature } = require('../../utils/razorpay');
const { success, error, paginated } = require('../../utils/response');

exports.getBalance = async (req, res) => {
  try {
    const { rows: [user] } = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [req.user.id]);
    return success(res, { balance: parseFloat(user.wallet_balance) });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { rows } = await db.query(
      `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    const { rows: [count] } = await db.query(
      'SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1', [req.user.id]
    );
    return paginated(res, rows, parseInt(count.count), page, limit);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.initiateTopup = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10 || amount > 100000) {
      return error(res, 400, 'Amount must be between ₹10 and ₹1,00,000');
    }
    const order = await createOrder(amount * 100, 'INR', `wallet_${req.user.id}_${Date.now()}`);
    await db.query(
      `INSERT INTO payments(user_id, amount, gst_amount, final_amount, status, razorpay_order_id, metadata)
       VALUES($1,$2,0,$2,'pending',$3,$4)`,
      [req.user.id, amount, order.id, JSON.stringify({ type: 'wallet_topup' })]
    );
    return success(res, { order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.verifyTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const valid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return error(res, 400, 'Invalid payment signature');

    const { rows: [payment] } = await db.query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1 AND user_id = $2',
      [razorpay_order_id, req.user.id]
    );
    if (!payment || payment.status === 'success') return error(res, 400, 'Payment already processed');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE payments SET status=$1, razorpay_payment_id=$2, razorpay_signature=$3 WHERE id=$4',
        ['success', razorpay_payment_id, razorpay_signature, payment.id]
      );
      const { rows: [user] } = await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
        [payment.amount, req.user.id]
      );
      await client.query(
        `INSERT INTO wallet_transactions(user_id,type,amount,balance_after,reference_type,reference_id,description)
         VALUES($1,'credit',$2,$3,'topup',$4,'Wallet top-up via Razorpay')`,
        [req.user.id, payment.amount, user.wallet_balance, payment.id]
      );
      await client.query('COMMIT');
      return success(res, { new_balance: parseFloat(user.wallet_balance), amount_added: payment.amount });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    return error(res, 500, err.message);
  }
};
