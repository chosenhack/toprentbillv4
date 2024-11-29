import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import pool from '../db';

const router = Router();

router.use(authMiddleware);

const customerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  subscriptionType: z.string(),
  paymentFrequency: z.string(),
  amount: z.number().positive(),
  stripeLink: z.string().optional(),
  crmLink: z.string().optional(),
  salesTeam: z.string(),
  isLuxury: z.boolean(),
  billingInfo: z.object({
    companyName: z.string(),
    vatNumber: z.string(),
    country: z.string(),
    address: z.string(),
    sdi: z.string().optional(),
    pec: z.string().optional()
  }).optional()
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, b.* 
      FROM customers c 
      LEFT JOIN billing_info b ON c.id = b.customer_id 
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = customerSchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO customers (
        name, email, subscription_type, payment_frequency, amount,
        stripe_link, crm_link, sales_team, is_luxury, activation_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        customer.name,
        customer.email,
        customer.subscriptionType,
        customer.paymentFrequency,
        customer.amount,
        customer.stripeLink,
        customer.crmLink,
        customer.salesTeam,
        customer.isLuxury
      ]
    );
    
    if (customer.billingInfo) {
      await pool.query(
        `INSERT INTO billing_info (
          customer_id, company_name, vat_number, country,
          address, sdi, pec
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          result.rows[0].id,
          customer.billingInfo.companyName,
          customer.billingInfo.vatNumber,
          customer.billingInfo.country,
          customer.billingInfo.address,
          customer.billingInfo.sdi,
          customer.billingInfo.pec
        ]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;