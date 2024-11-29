import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import pool from '../db';

const router = Router();

router.use(authMiddleware);

const paymentSchema = z.object({
  customerId: z.number(),
  amount: z.number().positive(),
  date: z.string(),
  status: z.string()
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as customer_name, c.email as customer_email
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      ORDER BY p.date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payment = paymentSchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO payments (
        customer_id, amount, date, status, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        payment.customerId,
        payment.amount,
        payment.date,
        payment.status,
        req.user?.id
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;