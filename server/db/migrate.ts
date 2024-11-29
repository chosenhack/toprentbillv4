import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createDatabase = async () => {
  try {
    // Create database if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'subscription_manager') THEN
          CREATE DATABASE subscription_manager;
        END IF;
      END $$;
    `);

    // Connect to the subscription_manager database
    const dbPool = new Pool({
      ...pool.options,
      database: 'subscription_manager'
    });

    // Create tables
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subscription_type VARCHAR(50) NOT NULL,
        payment_frequency VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        stripe_link VARCHAR(255),
        crm_link VARCHAR(255),
        active BOOLEAN DEFAULT true,
        activation_date TIMESTAMP WITH TIME ZONE NOT NULL,
        deactivation_date TIMESTAMP WITH TIME ZONE,
        sales_team VARCHAR(50) NOT NULL,
        is_luxury BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS billing_info (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        company_name VARCHAR(255) NOT NULL,
        vat_number VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        sdi VARCHAR(255),
        pec VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        amount DECIMAL(10,2) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        details JSONB NOT NULL
      );
    `);

    console.log('Database and tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

createDatabase();