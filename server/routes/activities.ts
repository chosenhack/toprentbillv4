import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import pool from '../db';

const router = Router();

router.use(authMiddleware);

const activitySchema = z.object({
  type: z.string(),
  details: z.record(z.unknown())
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM activities
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const activity = activitySchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO activities (
        type, user_id, user_name, details
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        activity.type,
        req.user?.id,
        req.user?.email,
        activity.details
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;