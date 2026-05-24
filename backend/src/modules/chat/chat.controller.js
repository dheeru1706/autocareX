const db = require('../../config/database');
const { success, error } = require('../../utils/response');
const { publishToRoom } = require('../../websocket/socket');

exports.getConversations = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cc.*, b.booking_number, sp.name AS service_name,
              cm.message AS last_message, cm.sent_at AS last_message_at,
              COUNT(cm2.id) FILTER (WHERE cm2.is_read = false AND cm2.sender_id != $1) AS unread_count
       FROM chat_conversations cc
       JOIN bookings b ON b.id = cc.booking_id
       JOIN service_packages sp ON sp.id = b.service_package_id
       LEFT JOIN chat_messages cm ON cm.id = (
         SELECT id FROM chat_messages WHERE conversation_id = cc.id ORDER BY sent_at DESC LIMIT 1
       )
       LEFT JOIN chat_messages cm2 ON cm2.conversation_id = cc.id
       WHERE cc.consumer_id = $1 OR cc.partner_id = $1
       GROUP BY cc.id, b.booking_number, sp.name, cm.message, cm.sent_at
       ORDER BY COALESCE(cm.sent_at, cc.created_at) DESC`,
      [req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let { rows: [conv] } = await db.query(
      'SELECT * FROM chat_conversations WHERE booking_id = $1', [bookingId]
    );
    if (!conv) {
      const { rows: [booking] } = await db.query(
        'SELECT consumer_id, partner_id FROM bookings b JOIN franchise_partners fp ON fp.id = b.partner_id WHERE b.id = $1',
        [bookingId]
      );
      if (!booking) return error(res, 404, 'Booking not found');
      const { rows: [newConv] } = await db.query(
        'INSERT INTO chat_conversations(booking_id, consumer_id, partner_id) VALUES($1,$2,$3) RETURNING *',
        [bookingId, booking.consumer_id, booking.partner_id]
      );
      conv = newConv;
    }
    return success(res, conv);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    let query = 'SELECT * FROM chat_messages WHERE conversation_id = $1';
    const params = [conversationId];
    if (before) { query += ` AND sent_at < $${params.push(before)}`; }
    query += ` ORDER BY sent_at DESC LIMIT $${params.push(parseInt(limit))}`;
    const { rows } = await db.query(query, params);
    return success(res, rows.reverse());
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, message_type = 'text', media_url, lat, lng } = req.body;
    const { rows: [msg] } = await db.query(
      `INSERT INTO chat_messages(conversation_id, sender_id, message, message_type, media_url, lat, lng)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [conversationId, req.user.id, message, message_type, media_url, lat, lng]
    );
    await db.query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);
    // Broadcast via WebSocket
    try { publishToRoom(`chat:${conversationId}`, 'new_message', msg); } catch (_) {}
    return success(res, msg, 201);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await db.query(
      'UPDATE chat_messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
      [conversationId, req.user.id]
    );
    return success(res, { marked: true });
  } catch (err) {
    return error(res, 500, err.message);
  }
};
