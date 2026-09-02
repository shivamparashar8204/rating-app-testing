require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

async function initializeDatabase() {
  const client = new Client(config);

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();

    // Check if database exists
    const dbCheckQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await client.query(dbCheckQuery, [process.env.DB_NAME]);

    if (!dbExists.rows.length) {
      console.log(`Creating database ${process.env.DB_NAME}...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully.`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }

    await client.end();

    // Connect to the new database and run schema
    const dbClient = new Client({
      ...config,
      database: process.env.DB_NAME,
    });

    await dbClient.connect();
    console.log(`Connected to database ${process.env.DB_NAME}.`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running schema...');
    await dbClient.query(schema);
    console.log('Schema created successfully.');

    await dbClient.end();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();