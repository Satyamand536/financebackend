/**
 * Database Seeder Script
 * ======================
 * Purpose  : Populate the MongoDB database with realistic demo data for
 *            development and testing purposes.
 * Usage    : node src/scripts/seed.js
 * Warning  : This will WIPE all existing data before seeding.
 *            Do NOT run in production.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User          = require('../modules/user/user.model');
const FinanceRecord = require('../modules/finance/finance.model');

// ─────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────

const USERS = [
  {
    name:     'Alice Admin',
    email:    process.env.SEED_ADMIN_EMAIL || 'admin@financeapp.dev',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role:     'ADMIN',
    status:   'ACTIVE'
  },
  {
    name:     'Bob Analyst',
    email:    process.env.SEED_ANALYST_EMAIL || 'analyst@financeapp.dev',
    password: process.env.SEED_ANALYST_PASSWORD || 'Analyst@12345',
    role:     'ANALYST',
    status:   'ACTIVE'
  },
  {
    name:     'Carol Viewer',
    email:    process.env.SEED_VIEWER_EMAIL || 'viewer@financeapp.dev',
    password: process.env.SEED_VIEWER_PASSWORD || 'Viewer@12345',
    role:     'VIEWER',
    status:   'ACTIVE'
  },
  {
    name:     'Dan Inactive',
    email:    'inactive@financeapp.dev',
    password: 'Inactive@12345',
    role:     'VIEWER',
    status:   'INACTIVE'
  }
];

/**
 * Generates financial records spread across the last 6 months
 * so the monthly trends chart has meaningful data to display.
 */
const generateFinanceRecords = (adminId) => {
  const records = [];
  const categories = {
    INCOME:  ['Salary', 'Freelance', 'Investments', 'Consulting', 'Rental Income'],
    EXPENSE: ['Rent', 'Groceries', 'Utilities', 'Marketing', 'Office Supplies', 'Travel', 'Software Subscriptions', 'Salaries']
  };

  // Generate ~60 records spread over the last 6 months
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - monthOffset);

    // 3-6 income records per month
    const incomeCount = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < incomeCount; i++) {
      const date = new Date(baseDate);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      const cat = categories.INCOME[Math.floor(Math.random() * categories.INCOME.length)];

      records.push({
        amount:    parseFloat((Math.random() * 8000 + 2000).toFixed(2)),
        type:      'INCOME',
        category:  cat,
        date,
        note:      `${cat} payment received for ${date.toLocaleString('default', { month: 'long' })}`,
        createdBy: adminId,
        isDeleted: false
      });
    }

    // 4-8 expense records per month
    const expenseCount = Math.floor(Math.random() * 5) + 4;
    for (let i = 0; i < expenseCount; i++) {
      const date = new Date(baseDate);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      const cat = categories.EXPENSE[Math.floor(Math.random() * categories.EXPENSE.length)];

      records.push({
        amount:    parseFloat((Math.random() * 3000 + 200).toFixed(2)),
        type:      'EXPENSE',
        category:  cat,
        date,
        note:      `${cat} expenditure for ${date.toLocaleString('default', { month: 'long' })}`,
        createdBy: adminId,
        isDeleted: false
      });
    }
  }

  return records;
};

// ─────────────────────────────────────────────
// Seed Executor
// ─────────────────────────────────────────────

const seedDatabase = async () => {
  try {
    console.log('\n🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Wipe existing data ──────────────────────
    console.log('\n🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      FinanceRecord.deleteMany({})
    ]);
    console.log('✅ Collections cleared');

    // ── Seed Users (hash passwords first) ──────
    console.log('\n👥 Seeding users...');
    const hashedUsers = await Promise.all(
      USERS.map(async user => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );

    const createdUsers = await User.insertMany(hashedUsers);
    const adminUser    = createdUsers.find(u => u.role === 'ADMIN');
    console.log(`✅ Seeded ${createdUsers.length} users`);

    // ── Seed Finance Records ────────────────────
    console.log('\n💰 Seeding finance records...');
    const records = generateFinanceRecords(adminUser._id);
    await FinanceRecord.insertMany(records);
    console.log(`✅ Seeded ${records.length} finance records`);

    // ── Summary ─────────────────────────────────
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Test Credentials:');
    console.log(`  ADMIN    → ${USERS[0].email} / (Password from ENV or Default)`);
    console.log(`  ANALYST  → ${USERS[1].email} / (Password from ENV or Default)`);
    console.log(`  VIEWER   → ${USERS[2].email} / (Password from ENV or Default)`);
    console.log('\n⚠️  IMPORTANT: The seeder bypasses Mongoose pre-save hooks.');
    console.log('   Passwords are hashed directly in the seed script.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeder failed:', err.message);
    process.exit(1);
  }
};

seedDatabase();
