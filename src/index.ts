import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import "reflect-metadata"
import { DataSource } from "typeorm"

const bodyParser = require('body-parser');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const appDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "cse412",
  database: "postgres",
})

const cors = require('cors');
app.use(cors({
    origin: '*'
}));

appDataSource.initialize()
  .then(() => {
    console.log("[postgres]: Connected");
  })
  .catch((err) => {
    console.error("[postgres]: Error", err);
  })

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server for CSE412 Honors Project');
});

/**************************************************
 * Queries
 **************************************************/

/*Select the top 5 customers who have spent the most money in the store within the last 3 months*/
app.get('/customers/top=:months', async (req: Request, res: Response) => {
  const input = req.params.months;
  try {
      const rawData = await appDataSource.manager.query(`SELECT c.first_name, c.last_name, SUM(oi.item_price * oi.item_quantity) AS total_spent
      FROM customers c
      JOIN orders o ON c.customer_id = o.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_date >= NOW() - INTERVAL '${input} months'
      GROUP BY c.customer_id, c.first_name, c.last_name
      ORDER BY total_spent DESC
      LIMIT 5;`);
      res.status(200).json(rawData);
      return;
  }
  catch {
      res.status(400).json({
          status: 400,
          error: "unexcepted error occured"
      });
      return;
  }
});

/* The top 3 categories that have made the most money in the last month */
app.get('/groups/top=:months', async (req: Request, res: Response) => {
  const input = req.params.months;
  try {
      const rawData = await appDataSource.manager.query(`SELECT ig.group_name, SUM(oi.item_price * oi.item_quantity) AS total_revenue
      FROM item_groups ig
      JOIN products p ON ig.group_id = p.group_id
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_date >= NOW() - INTERVAL '${input} months'
      GROUP BY ig.group_id, ig.group_name
      ORDER BY total_revenue DESC
      LIMIT 3;`);
      res.status(200).json(rawData);
      return;
  }
  catch {
      res.status(400).json({
          status: 400,
          error: "unexcepted error occured"
      });
      return;
  }
});

/* Get the top 10 customers who have completed purchases from the same category the most in all time */ 
app.get('/customers/top/group', async (req: Request, res: Response) => {
  const input = req.params.months;
  try {
      const rawData = await appDataSource.manager.query(`SELECT c.first_name, c.last_name, COUNT(p.group_id) AS num_groups
      FROM customers c
      JOIN orders o ON c.customer_id = o.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN (
        SELECT c1.customer_id, p1.group_id, COUNT(DISTINCT p1.product_id) AS num_products
        FROM customers c1
        JOIN orders o1 ON c1.customer_id = o1.customer_id
        JOIN order_items oi1 ON o1.order_id = oi1.order_id
        JOIN products p1 ON oi1.product_id = p1.product_id
        GROUP BY c1.customer_id, p1.group_id
      ) AS customer_group_products ON c.customer_id = customer_group_products.customer_id AND p.group_id  = customer_group_products.group_id
      GROUP BY c.customer_id, c.first_name, c.last_name
      ORDER BY num_groups DESC
      LIMIT 10;`);
      res.status(200).json(rawData);
      return;
  }
  catch {
      res.status(400).json({
          status: 400,
          error: "unexcepted error occured"
      });
      return;
  }
});


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});