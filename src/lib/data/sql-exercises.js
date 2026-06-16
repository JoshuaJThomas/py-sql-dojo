export const sqlDbSeed = `
CREATE TABLE departments (
  dept_id INTEGER PRIMARY KEY,
  dept_name TEXT NOT NULL,
  manager_id INTEGER,
  location TEXT
);

CREATE TABLE employees (
  emp_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  salary REAL,
  dept_id INTEGER,
  hire_date TEXT,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  city TEXT,
  country TEXT
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date TEXT,
  total_amount REAL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

INSERT INTO departments VALUES (1, 'Engineering', 101, 'New York');
INSERT INTO departments VALUES (2, 'Sales', 103, 'London');
INSERT INTO departments VALUES (3, 'Marketing', 104, 'London');
INSERT INTO departments VALUES (4, 'HR', 106, 'Paris');
INSERT INTO departments VALUES (5, 'Finance', NULL, 'New York');

INSERT INTO employees VALUES (101, 'Alice Smith', 34, 95000, 1, '2020-03-15');
INSERT INTO employees VALUES (102, 'Bob Jones', 28, 72000, 1, '2021-06-20');
INSERT INTO employees VALUES (103, 'Charlie Brown', 42, 110000, 2, '2018-01-10');
INSERT INTO employees VALUES (104, 'David Green', 29, 65000, 3, '2022-11-01');
INSERT INTO employees VALUES (105, 'Emma White', 31, 80000, 2, '2020-08-15');
INSERT INTO employees VALUES (106, 'Frank Black', 45, 88000, 4, '2019-05-05');
INSERT INTO employees VALUES (107, 'Grace Kelly', 25, 60000, 1, '2023-02-28');
INSERT INTO employees VALUES (108, 'Henry Ford', 50, 125000, 5, '2015-10-01');

INSERT INTO customers VALUES (501, 'TechCorp', 'New York', 'USA');
INSERT INTO customers VALUES (502, 'RetailGiant', 'London', 'UK');
INSERT INTO customers VALUES (503, 'GlobalLogistics', 'Tokyo', 'Japan');
INSERT INTO customers VALUES (504, 'BioLab', 'Paris', 'France');
INSERT INTO customers VALUES (505, 'NordicTrading', 'Oslo', 'Norway');

INSERT INTO orders VALUES (9001, 501, '2023-10-01', 12000.50);
INSERT INTO orders VALUES (9002, 502, '2023-10-03', 5400.00);
INSERT INTO orders VALUES (9003, 501, '2023-10-04', 3200.00);
INSERT INTO orders VALUES (9004, 503, '2023-10-05', 15000.00);
INSERT INTO orders VALUES (9005, 504, '2023-10-07', 850.00);
INSERT INTO orders VALUES (9006, 502, '2023-10-09', 6100.20);
INSERT INTO orders VALUES (9007, 505, '2023-10-10', 4300.00);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT,
  price REAL
);

CREATE TABLE order_items (
  item_id INTEGER PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO products VALUES (101, 'Laptop', 'Electronics', 1200.00);
INSERT INTO products VALUES (102, 'Monitor', 'Electronics', 300.00);
INSERT INTO products VALUES (103, 'Keyboard', 'Electronics', 80.00);
INSERT INTO products VALUES (104, 'Office Chair', 'Furniture', 250.00);
INSERT INTO products VALUES (105, 'Desk Lamp', 'Furniture', 45.00);
INSERT INTO products VALUES (106, 'Python Book', 'Books', 35.00);
INSERT INTO products VALUES (107, 'SQL Guide', 'Books', 40.00);
INSERT INTO products VALUES (108, 'Wireless Mouse', 'Electronics', 25.00);

INSERT INTO order_items VALUES (1, 9001, 101, 9, 1200.00);
INSERT INTO order_items VALUES (2, 9001, 102, 4, 300.00);
INSERT INTO order_items VALUES (3, 9002, 101, 4, 1200.00);
INSERT INTO order_items VALUES (4, 9002, 103, 7, 80.00);
INSERT INTO order_items VALUES (5, 9003, 104, 10, 250.00);
INSERT INTO order_items VALUES (6, 9003, 102, 2, 300.00);
INSERT INTO order_items VALUES (7, 9004, 101, 12, 1200.00);
INSERT INTO order_items VALUES (8, 9004, 102, 2, 300.00);
INSERT INTO order_items VALUES (9, 9005, 106, 10, 35.00);
INSERT INTO order_items VALUES (10, 9005, 107, 12, 40.00);
INSERT INTO order_items VALUES (11, 9006, 101, 5, 1200.00);
INSERT INTO order_items VALUES (12, 9006, 105, 2, 45.00);
INSERT INTO order_items VALUES (13, 9007, 104, 16, 250.00);
INSERT INTO order_items VALUES (14, 9007, 103, 3, 80.00);
`;

export const sqlExercises = [
  {
    id: "sql-select-all-01",
    chapter: 1,
    topic: "SELECT",
    title: "Select All Employees",
    prompt: "Retrieve all records and columns from the `employees` table.",
    starterCode: "-- Write your SQL query here\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('name') && result[0].columns.includes('salary'), msg: "Result must contain the 'name' and 'salary' columns" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Result must return exactly 8 employee rows" }
    ],
    hint: "Use `SELECT * FROM employees;`",
    solution: "SELECT * FROM employees;",
    difficulty: "easy"
  },
  {
    id: "sql-select-cols-02",
    chapter: 1,
    topic: "SELECT",
    title: "Select Specific Columns",
    prompt: "Retrieve only the `name` and `salary` columns for all employees.",
    starterCode: "-- Select name and salary from employees\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.length === 2, msg: "Result must contain exactly 2 columns" },
      { rule: (result) => result && result[0].columns.includes('name') && result[0].columns.includes('salary'), msg: "Result must contain only 'name' and 'salary' columns" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Result must return 8 rows" }
    ],
    hint: "Use `SELECT name, salary FROM employees;`",
    solution: "SELECT name, salary FROM employees;",
    difficulty: "easy"
  },
  {
    id: "sql-where-salary-03",
    chapter: 1,
    topic: "WHERE",
    title: "Filter by Salary",
    prompt: "Select the `name` and `salary` of all employees who earn more than 80,000.",
    starterCode: "-- Select employees earning > 80000\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 4, msg: "Result must contain exactly 4 matching employees" },
      { rule: (result) => result && result[0].values.every(row => row[1] > 80000), msg: "All returned employees must have a salary greater than 80000" }
    ],
    hint: "Use `SELECT name, salary FROM employees WHERE salary > 80000;`",
    solution: "SELECT name, salary FROM employees WHERE salary > 80000;",
    difficulty: "easy"
  },
  {
    id: "sql-where-compound-04",
    chapter: 1,
    topic: "WHERE",
    title: "Compound Conditions",
    prompt: "Select the `name`, `age`, and `salary` of all employees who are over 30 years old AND earn more than 80,000.",
    starterCode: "-- Select employees over 30 and earning > 80000\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 3, msg: "Result must contain exactly 3 matching rows" },
      { rule: (result) => result && result[0].values.every(row => row[1] > 30 && row[2] > 80000), msg: "All returned rows must satisfy age > 30 and salary > 80000" }
    ],
    hint: "Use `SELECT name, age, salary FROM employees WHERE age > 30 AND salary > 80000;`",
    solution: "SELECT name, age, salary FROM employees WHERE age > 30 AND salary > 80000;",
    difficulty: "easy"
  },
  {
    id: "sql-like-wildcards-05",
    chapter: 2,
    topic: "LIKE",
    title: "Find Matching Customers",
    prompt: "Select the `customer_name` and `city` of all customers whose name contains the word 'Giant'.",
    starterCode: "-- Select customers with 'Giant' in their name\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1, msg: "Result must contain exactly 1 customer" },
      { rule: (result) => result && result[0].values[0][0] === 'RetailGiant', msg: "Selected customer must be 'RetailGiant'" }
    ],
    hint: "Use the `LIKE` operator with the wildcard character `%`. For example: `WHERE customer_name LIKE '%Giant%'`.",
    solution: "SELECT customer_name, city FROM customers WHERE customer_name LIKE '%Giant%';",
    difficulty: "easy"
  },
  {
    id: "sql-order-by-06",
    chapter: 2,
    topic: "ORDER BY",
    title: "Order by Salary & Name",
    prompt: "List all employees (retrieve their `name` and `salary`) ordered by their `salary` in descending order. For employees with the same salary, order them by `name` alphabetically (ascending).",
    starterCode: "-- Order employees by salary DESC, name ASC\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Result must return 8 rows" },
      { rule: (result) => {
        if (!result) return false;
        const vals = result[0].values;
        for (let i = 0; i < vals.length - 1; i++) {
          if (vals[i][1] < vals[i+1][1]) return false;
          if (vals[i][1] === vals[i+1][1] && vals[i][0] > vals[i+1][0]) return false;
        }
        return true;
      }, msg: "Result is not correctly ordered by salary descending and name ascending on ties" }
    ],
    hint: "Use `ORDER BY salary DESC, name ASC;`",
    solution: "SELECT name, salary FROM employees ORDER BY salary DESC, name ASC;",
    difficulty: "easy"
  },
  {
    id: "sql-count-07",
    chapter: 3,
    topic: "Aggregate Functions",
    title: "Count Employees",
    prompt: "Count the total number of employees in the company. Name the result column `total_employees`.",
    starterCode: "-- Count total employees\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns[0] === 'total_employees', msg: "Result column must be named 'total_employees'" },
      { rule: (result) => result && result[0].values[0][0] === 8, msg: "Count should be exactly 8" }
    ],
    hint: "Use `SELECT COUNT(*) AS total_employees FROM employees;`",
    solution: "SELECT COUNT(*) AS total_employees FROM employees;",
    difficulty: "easy"
  },
  {
    id: "sql-groupby-08",
    chapter: 3,
    topic: "GROUP BY",
    title: "Average Salary by Department",
    prompt: "Find the average salary for each department ID in the `employees` table. Output two columns: `dept_id` and the average salary as `avg_salary`.",
    starterCode: "-- Group by dept_id and get average salary\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('dept_id') && result[0].columns.includes('avg_salary'), msg: "Result must include columns 'dept_id' and 'avg_salary'" },
      { rule: (result) => {
        if (!result) return false;
        const vals = result[0].values;
        return vals.length === 5 && vals.some(row => row[0] === 1 && Math.abs(row[1] - 75666.67) < 0.1);
      }, msg: "Aggregated average salaries per department are not correct" }
    ],
    hint: "Use `SELECT dept_id, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id;`",
    solution: "SELECT dept_id, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id;",
    difficulty: "medium"
  },
  {
    id: "sql-having-09",
    chapter: 3,
    topic: "HAVING",
    title: "Filter Groups by Total Salary",
    prompt: "List all department IDs (`dept_id`) where the total salary expense (SUM) is greater than 150,000. Name the sum column `total_expense`.",
    starterCode: "-- Sum salaries by dept and filter using HAVING\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('total_expense'), msg: "Sum column must be named 'total_expense'" },
      { rule: (result) => result && result[0].values.length === 2 && result[0].values.every(row => row[1] > 150000), msg: "Output must contain only department IDs where the total salary is > 150000" }
    ],
    hint: "Remember that `WHERE` filters rows before grouping, and `HAVING` filters groups after grouping. Use `GROUP BY dept_id HAVING SUM(salary) > 150000;`",
    solution: "SELECT dept_id, SUM(salary) AS total_expense FROM employees GROUP BY dept_id HAVING SUM(salary) > 150000;",
    difficulty: "medium"
  },
  {
    id: "sql-join-inner-10",
    chapter: 4,
    topic: "JOINS",
    title: "Inner Join Employees & Departments",
    prompt: "Perform an INNER JOIN between `employees` and `departments` to retrieve the employee's `name` and their department's `dept_name`.",
    starterCode: "-- Join employees and departments\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('name') && result[0].columns.includes('dept_name'), msg: "Result must contain columns 'name' and 'dept_name'" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Result must contain exactly 8 employee rows" }
    ],
    hint: "Join the tables on the matching department IDs: `ON employees.dept_id = departments.dept_id`.",
    solution: "SELECT e.name, d.dept_name FROM employees e INNER JOIN departments d ON e.dept_id = d.dept_id;",
    difficulty: "medium"
  },
  {
    id: "sql-join-left-11",
    chapter: 4,
    topic: "JOINS",
    title: "Left Join Department Employee Count",
    prompt: "Retrieve a list of all department names (`dept_name`) along with the count of employees in that department (as `employee_count`). Include departments that currently have 0 employees in the result.",
    starterCode: "-- Include all departments in employee count list\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "Result must contain all 5 departments" },
      { rule: (result) => {
        if (!result) return false;
        const vals = result[0].values;
        return vals.some(row => row[0] === 'HR' && row[1] === 1) && vals.some(row => row[0] === 'Finance' && row[1] === 0);
      }, msg: "Aggregated count should show 1 for HR and 0 for Finance" }
    ],
    hint: "Use `LEFT JOIN departments d ON d.dept_id = e.dept_id` (or start with departments and LEFT JOIN employees). Use `COUNT(e.emp_id)` instead of `COUNT(*)` so that departments with no employees return 0 instead of 1.",
    solution: "SELECT d.dept_name, COUNT(e.emp_id) AS employee_count FROM departments d LEFT JOIN employees e ON d.dept_id = e.dept_id GROUP BY d.dept_name;",
    difficulty: "hard"
  },
  {
    id: "sql-subquery-12",
    chapter: 5,
    topic: "Subqueries",
    title: "Employees Earning Above Average",
    prompt: "Find the name and salary of all employees who earn more than the average salary of all employees.",
    starterCode: "-- Find employees earning > average salary\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 4, msg: "Result must contain exactly 4 matching employees" },
      { rule: (result) => result && result[0].values.every(row => row[1] > 83125), msg: "All returned employees must earn more than 83125" }
    ],
    hint: "Use a subquery in the `WHERE` clause: `WHERE salary > (SELECT AVG(salary) FROM employees)`.",
    solution: "SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);",
    difficulty: "medium"
  },
  {
    id: "sql-join-multi-13",
    chapter: 5,
    topic: "JOINS",
    title: "Multi-Table Join Filter",
    prompt: "Retrieve the `order_id`, `customer_name`, and `total_amount` for all orders placed by customers from the 'USA' or 'UK'.",
    starterCode: "-- Order details for US/UK customers\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "Result must contain exactly 5 order rows" },
      { rule: (result) => result && result[0].values.every(row => row[1] === 'TechCorp' || row[1] === 'RetailGiant'), msg: "All returned orders must correspond to customers TechCorp or RetailGiant" }
    ],
    hint: "Join `orders` and `customers` on `customer_id` and use `WHERE country IN ('USA', 'UK')`.",
    solution: "SELECT o.order_id, c.customer_name, o.total_amount FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id WHERE c.country IN ('USA', 'UK');",
    difficulty: "medium"
  },
  {
    id: "sql-complex-agg-14",
    chapter: 6,
    topic: "JOINS & Aggregations",
    title: "Highest Revenue City",
    prompt: "Find the city that has generated the highest total revenue (sum of order amounts) from customer orders. Output the `city` and the `total_revenue`.",
    starterCode: "-- Find city with maximum order revenue\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1, msg: "Result must contain exactly 1 city" },
      { rule: (result) => result && result[0].values[0][0] === 'New York' && Math.abs(result[0].values[0][1] - 15200.5) < 0.1, msg: "Selected city must be 'New York' with revenue 15200.5" }
    ],
    hint: "Join `orders` with `customers`, group by `city`, sum the `total_amount`, order by the sum descending, and use `LIMIT 1`.",
    solution: "SELECT c.city, SUM(o.total_amount) AS total_revenue FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.city ORDER BY total_revenue DESC LIMIT 1;",
    difficulty: "hard"
  },
  {
    id: "sql-manager-salaries-15",
    chapter: 6,
    topic: "Self Join & Relations",
    title: "Department Managers & Salaries",
    prompt: "Retrieve the `dept_name` along with the manager's `name` and `salary` for all departments that have an assigned manager.",
    starterCode: "-- Find managers' names and salaries by department\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 4, msg: "Result must contain exactly 4 departments with managers" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Engineering' && row[1] === 'Alice Smith' && row[2] === 95000), msg: "Selected department managers details must be correct" }
    ],
    hint: "Join `departments d` with `employees e` on `d.manager_id = e.emp_id`.",
    solution: "SELECT d.dept_name, e.name, e.salary FROM departments d INNER JOIN employees e ON d.manager_id = e.emp_id;",
    difficulty: "hard"
  },
  {
    id: "sql-product-filter-16",
    chapter: 7,
    topic: "Filtering & Sorting",
    title: "Filter Expensive Electronics",
    prompt: "Select `product_name` and `price` from the `products` table for all products in the 'Electronics' category with a price greater than 100. Sort the results by `price` descending.",
    starterCode: "-- Filter and sort electronic products\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 2, msg: "Result must contain exactly 2 products (Laptop and Monitor)" },
      { rule: (result) => result && result[0].values[0][0] === 'Laptop' && result[0].values[0][1] === 1200, msg: "First item must be the Laptop costing 1200" }
    ],
    hint: "Use `WHERE category = 'Electronics' AND price > 100 ORDER BY price DESC;`",
    solution: "SELECT product_name, price FROM products WHERE category = 'Electronics' AND price > 100 ORDER BY price DESC;",
    difficulty: "easy"
  },
  {
    id: "sql-category-counts-17",
    chapter: 7,
    topic: "Aggregation",
    title: "Count Products by Category",
    prompt: "Retrieve the `category` and count of products in each category (as `product_count`). Group the results by `category` and order them by `product_count` descending.",
    starterCode: "-- Count products by category\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 3, msg: "Result must contain 3 categories" },
      { rule: (result) => result && result[0].values[0][0] === 'Electronics' && result[0].values[0][1] === 4, msg: "Electronics must have 4 products" }
    ],
    hint: "Use `SELECT category, COUNT(*) AS product_count FROM products GROUP BY category ORDER BY product_count DESC;`",
    solution: "SELECT category, COUNT(*) AS product_count FROM products GROUP BY category ORDER BY product_count DESC;",
    difficulty: "easy"
  },
  {
    id: "sql-quantity-sold-18",
    chapter: 8,
    topic: "JOINS & Aggregations",
    title: "Total Quantity Sold per Product",
    prompt: "Find the total quantity of each product sold. Retrieve the `product_name` and the sum of `quantity` (as `total_quantity`) from joining `products` and `order_items`. Group by `product_name` and order by `total_quantity` descending.",
    starterCode: "-- Find sum of quantities sold per product\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Laptop' && row[1] === 30), msg: "Laptop must have a total quantity sold of 30" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Office Chair' && row[1] === 26), msg: "Office Chair must have a total quantity sold of 26" }
    ],
    hint: "Use `INNER JOIN order_items ON products.product_id = order_items.product_id`, group by `product_name`, and sum the `quantity`.",
    solution: "SELECT p.product_name, SUM(oi.quantity) AS total_quantity FROM products p INNER JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_name ORDER BY total_quantity DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-orders-books-19",
    chapter: 8,
    topic: "Subqueries & Joins",
    title: "Orders Containing Books",
    prompt: "Retrieve the distinct `order_id` for all orders that contain at least one product from the 'Books' category.",
    starterCode: "-- Select order_id for book purchases\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1 && result[0].values[0][0] === 9005, msg: "Only order 9005 should contain books" }
    ],
    hint: "Join `order_items` with `products` and filter by `category = 'Books'` to select `DISTINCT order_id`.",
    solution: "SELECT DISTINCT oi.order_id FROM order_items oi INNER JOIN products p ON oi.product_id = p.product_id WHERE p.category = 'Books';",
    difficulty: "medium"
  },
  {
    id: "sql-avg-price-category-20",
    chapter: 9,
    topic: "HAVING Clause",
    title: "High Average Price Categories",
    prompt: "Find the average price (as `avg_price`) of products in each category, showing only those categories where the average price is greater than 100.",
    starterCode: "-- Categories with average product price > 100\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 2, msg: "Only 2 categories should qualify (Electronics and Furniture)" },
      { rule: (result) => result && result[0].values.every(row => row[1] > 100), msg: "All returned categories must have average price > 100" }
    ],
    hint: "Group by `category` and use a `HAVING AVG(price) > 100` clause.",
    solution: "SELECT category, AVG(price) AS avg_price FROM products GROUP BY category HAVING avg_price > 100;",
    difficulty: "medium"
  },
  {
    id: "sql-high-value-items-21",
    chapter: 9,
    topic: "Calculated Columns",
    title: "High Value Order Items",
    prompt: "Select the `order_id`, product's `product_name`, the item `quantity`, and calculated subtotal (calculated as `quantity * unit_price` and named `subtotal`) for all items in `order_items` where the subtotal is greater than 3,000. Sort descending by `subtotal`.",
    starterCode: "-- Items with subtotal > 3000\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "There must be exactly 5 matching order items" },
      { rule: (result) => result && result[0].values[0][3] === 14400, msg: "The highest subtotal must be 14,400" }
    ],
    hint: "Join `order_items oi` with `products p` on `oi.product_id = p.product_id` and filter in `WHERE (oi.quantity * oi.unit_price) > 3000`.",
    solution: "SELECT oi.order_id, p.product_name, oi.quantity, (oi.quantity * oi.unit_price) AS subtotal FROM order_items oi INNER JOIN products p ON oi.product_id = p.product_id WHERE subtotal > 3000 ORDER BY subtotal DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-never-ordered-22",
    chapter: 10,
    topic: "Joins & NULLs",
    title: "Products Never Ordered",
    prompt: "Retrieve the `product_name` of all products that have never been ordered (i.e. they do not have any matching records in the `order_items` table).",
    starterCode: "-- Find product names with no order records\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1 && result[0].values[0][0] === 'Wireless Mouse', msg: "Wireless Mouse should be the only product never ordered" }
    ],
    hint: "Use a `LEFT JOIN order_items` and check `WHERE order_items.product_id IS NULL`, or use a `NOT IN (SELECT product_id FROM order_items)` subquery.",
    solution: "SELECT p.product_name FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id WHERE oi.product_id IS NULL;",
    difficulty: "medium"
  },
  {
    id: "sql-top-customer-qty-23",
    chapter: 10,
    topic: "JOINS & Aggregations",
    title: "Top Customer by Items Purchased",
    prompt: "Find the customer name (`customer_name`) who purchased the highest total quantity of items across all their orders. Output the `customer_name` and their total quantity (as `total_items`).",
    starterCode: "-- Find the customer who bought the most items\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1 && result[0].values[0][0] === 'TechCorp' && result[0].values[0][1] === 25, msg: "Top customer must be TechCorp with 25 items purchased" }
    ],
    hint: "Join `customers`, `orders`, and `order_items`. Group by `customer_name`, sum `quantity`, order by the sum descending, and use `LIMIT 1`.",
    solution: "SELECT c.customer_name, SUM(oi.quantity) AS total_items FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id INNER JOIN order_items oi ON o.order_id = oi.order_id GROUP BY c.customer_name ORDER BY total_items DESC LIMIT 1;",
    difficulty: "hard"
  },
  {
    id: "sql-multi-item-orders-24",
    chapter: 11,
    topic: "HAVING & Aggregations",
    title: "Orders with Multiple Products",
    prompt: "Select the `order_id` and the count of unique products in that order (as `unique_product_count`) for all orders that contain more than 1 unique product.",
    starterCode: "-- Orders containing multiple unique products\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 7, msg: "All 7 orders contain exactly 2 unique products, so they should all be returned" }
    ],
    hint: "Group by `order_id` and use `HAVING COUNT(DISTINCT product_id) > 1`.",
    solution: "SELECT order_id, COUNT(DISTINCT product_id) AS unique_product_count FROM order_items GROUP BY order_id HAVING unique_product_count > 1;",
    difficulty: "medium"
  },
  {
    id: "sql-correlated-subquery-25",
    chapter: 12,
    topic: "Correlated Subqueries",
    title: "Most Expensive Product Per Category",
    prompt: "Retrieve the `category`, `product_name`, and `price` of the most expensive product in each category. Sort the results by `price` descending.",
    starterCode: "-- Find most expensive product in each category\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => {
          if (!result) return false;
          const rows = result[0].values;
          return rows.some(r => r[0] === 'Electronics' && r[1] === 'Laptop' && r[2] === 1200) &&
                 rows.some(r => r[0] === 'Furniture' && r[1] === 'Office Chair' && r[2] === 250) &&
                 rows.some(r => r[0] === 'Books' && r[1] === 'SQL Guide' && r[2] === 40);
        }, msg: "Must output the correct maximum-price product for each of the 3 categories" }
    ],
    hint: "Use a correlated subquery: `WHERE price = (SELECT MAX(price) FROM products p2 WHERE p2.category = products.category)`.",
    solution: "SELECT category, product_name, price FROM products WHERE price = (SELECT MAX(price) FROM products p2 WHERE p2.category = products.category) ORDER BY price DESC;",
    difficulty: "hard"
  },
  {
    id: "sql-groupby-multi-26",
    chapter: 3,
    topic: "GROUP BY",
    title: "Average Age and Salary by Department",
    prompt: "Select the `dept_id`, count of employees (as `emp_count`), average age (as `avg_age`), and average salary (as `avg_salary`) grouped by `dept_id`. Sort by `dept_id` ascending.",
    starterCode: "-- Group by dept_id and get multiple stats\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "Result must contain 5 department groups" },
      { rule: (result) => result && result[0].values[0][1] === 3 && Math.abs(result[0].values[0][3] - 75666.67) < 0.1, msg: "Dept 1 stats must match: 3 employees and avg salary 75666.67" }
    ],
    hint: "Use SELECT dept_id, COUNT(*) AS emp_count, AVG(age) AS avg_age, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id ORDER BY dept_id;",
    solution: "SELECT dept_id, COUNT(*) AS emp_count, AVG(age) AS avg_age, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id ORDER BY dept_id;",
    difficulty: "medium"
  },
  {
    id: "sql-coalesce-nulls-27",
    chapter: 10,
    topic: "NULL Handling",
    title: "Replace Null Manager IDs",
    prompt: "Select the department name (`dept_name`) and their manager ID. If the manager ID is NULL, return -1 instead. Name the manager column `manager_id_filled`.",
    starterCode: "-- Replace NULL manager IDs with -1\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('manager_id_filled'), msg: "Column must be named manager_id_filled" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Finance' && row[1] === -1), msg: "Finance manager_id_filled must be -1" }
    ],
    hint: "Use COALESCE(manager_id, -1) AS manager_id_filled.",
    solution: "SELECT dept_name, COALESCE(manager_id, -1) AS manager_id_filled FROM departments;",
    difficulty: "easy"
  },
  {
    id: "sql-cte-expression-28",
    chapter: 13,
    topic: "CTEs",
    title: "High-Earning Employee CTE",
    prompt: "Write a Common Table Expression (CTE) named `HighEarners` that selects all employees with a salary greater than 90,000. Then, query the CTE to retrieve the employee `name` and their department `dept_name` by joining with the `departments` table.",
    starterCode: "-- Use WITH HighEarners AS (...) select from HighEarners join departments\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 3, msg: "Should find exactly 3 high earners (> 90000)" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Alice Smith' && row[1] === 'Engineering'), msg: "Alice Smith in Engineering must be returned" }
    ],
    hint: "WITH HighEarners AS (SELECT * FROM employees WHERE salary > 90000) SELECT h.name, d.dept_name FROM HighEarners h JOIN departments d ON h.dept_id = d.dept_id;",
    solution: "WITH HighEarners AS (SELECT * FROM employees WHERE salary > 90000) SELECT h.name, d.dept_name FROM HighEarners h JOIN departments d ON h.dept_id = d.dept_id;",
    difficulty: "hard"
  },
  {
    id: "sql-case-statement-29",
    chapter: 14,
    topic: "CASE Statements",
    title: "Salary Category Bracket",
    prompt: "Select employee `name`, `salary`, and a new column named `salary_bracket`. Set `salary_bracket` to 'High' if salary is greater than 100,000, 'Medium' if between 80,000 and 100,000 (inclusive), and 'Low' otherwise. Sort by salary descending.",
    starterCode: "-- Categorize employee salaries into brackets\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][2] === 'High' && result[0].values[1][2] === 'High', msg: "Top two earners must be High bracket" },
      { rule: (result) => result && result[0].values.some(r => r[0] === 'Bob Jones' && r[2] === 'Low'), msg: "Bob Jones earning 72000 should be in Low bracket" }
    ],
    hint: "Use CASE WHEN salary > 100000 THEN 'High' WHEN salary >= 80000 THEN 'Medium' ELSE 'Low' END AS salary_bracket.",
    solution: "SELECT name, salary, CASE WHEN salary > 100000 THEN 'High' WHEN salary >= 80000 THEN 'Medium' ELSE 'Low' END AS salary_bracket FROM employees ORDER BY salary DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-exists-subquery-30",
    chapter: 15,
    topic: "EXISTS Subquery",
    title: "Customers with Active Orders",
    prompt: "Select the `customer_name` and `city` of all customers who have placed at least one order. Use the `EXISTS` operator.",
    starterCode: "-- Use EXISTS to find customers with orders\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "All 5 customers in the database have orders, so all 5 must be returned" }
    ],
    hint: "Use EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.customer_id).",
    solution: "SELECT customer_name, city FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);",
    difficulty: "hard"
  },
  {
    id: "sql-like-combos-31",
    chapter: 16,
    topic: "LIKE Operator",
    title: "Wildcard Text Match Combo",
    prompt: "Select all employees whose name starts with the letter 'H' or contains 'Smith'. Retrieve only their `name`.",
    starterCode: "-- Match names starting with H or containing Smith\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 2, msg: "Result must return exactly 2 employees (Alice Smith and Henry Ford)" }
    ],
    hint: "Use name LIKE 'H%' OR name LIKE '%Smith%'.",
    solution: "SELECT name FROM employees WHERE name LIKE 'H%' OR name LIKE '%Smith%';",
    difficulty: "easy"
  },
  {
    id: "sql-date-functions-32",
    chapter: 17,
    topic: "Date Functions",
    title: "Hire Date Year Extraction",
    prompt: "Extract the year of hiring from the `hire_date` column for all employees. Return employee `name` and the hiring year as `hire_year`. Sort by `hire_year` ascending.",
    starterCode: "-- Extract year from date string YYYY-MM-DD\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][1] === '2015', msg: "First employee (Henry Ford) was hired in 2015" }
    ],
    hint: "Use strftime('%Y', hire_date) or substr(hire_date, 1, 4).",
    solution: "SELECT name, strftime('%Y', hire_date) AS hire_year FROM employees ORDER BY hire_year ASC;",
    difficulty: "medium"
  },
  {
    id: "sql-self-join-33",
    chapter: 17,
    topic: "Self Joins",
    title: "Employee-Manager Relationships",
    prompt: "Join the `departments` and `employees` tables to show each employee `name` alongside their department's manager `name` (as `manager_name`). Only include employees whose department has a manager.",
    starterCode: "-- Show employee and their manager names\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 7, msg: "Should find 7 employees in departments with active managers (excluding Finance)" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Bob Jones' && row[1] === 'Alice Smith'), msg: "Bob Jones manager must be Alice Smith" }
    ],
    hint: "Join employees to departments on dept_id, then departments to employees again on manager_id.",
    solution: "SELECT e.name, m.name AS manager_name FROM employees e INNER JOIN departments d ON e.dept_id = d.dept_id INNER JOIN employees m ON d.manager_id = m.emp_id;",
    difficulty: "hard"
  },
  {
    id: "sql-concat-cols-34",
    chapter: 16,
    topic: "String Concatenation",
    title: "Format Customer Location",
    prompt: "Select customer `customer_name` and concatenate their `city` and `country` together in the format: 'City, Country' (e.g. 'New York, USA'). Name this column `location`.",
    starterCode: "-- Concatenate city and country columns\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][1] === 'New York, USA', msg: "First row location must format 'New York, USA' correctly" }
    ],
    hint: "Use || operator: city || ', ' || country AS location.",
    solution: "SELECT customer_name, (city || ', ' || country) AS location FROM customers;",
    difficulty: "easy"
  },
  {
    id: "sql-row-number-35",
    chapter: 18,
    topic: "Window Functions",
    title: "Rank Salaries in Department",
    prompt: "Assign a unique rank (`ROW_NUMBER`) to each employee within their department based on salary in descending order. Output employee `name`, `dept_id`, `salary`, and the rank as `salary_rank`.",
    starterCode: "-- Use ROW_NUMBER() OVER (...)\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('salary_rank'), msg: "Rank column must be named salary_rank" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Bob Jones' && row[1] === 1 && row[3] === 2), msg: "Bob Jones must be rank 2 in dept 1 (salary 72000 vs Alice 95000)" }
    ],
    hint: "Use ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS salary_rank.",
    solution: "SELECT name, dept_id, salary, ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS salary_rank FROM employees;",
    difficulty: "hard"
  },
  {
    id: "sql-having-multi-36",
    chapter: 9,
    topic: "HAVING Clause",
    title: "Departments with High Average Salary",
    prompt: "Retrieve `dept_id` and the average salary as `avg_salary` for departments that have more than 2 employees AND an average salary greater than 70,000.",
    starterCode: "-- Retrieve departments with > 2 employees and avg salary > 70000\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 1 && result[0].values[0][0] === 1, msg: "Only dept_id 1 (Engineering) has > 2 employees and avg salary > 70000" }
    ],
    hint: "Group by dept_id and filter in HAVING COUNT(*) > 2 AND AVG(salary) > 70000.",
    solution: "SELECT dept_id, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id HAVING COUNT(*) > 2 AND AVG(salary) > 70000;",
    difficulty: "medium"
  },
  {
    id: "sql-union-all-37",
    chapter: 13,
    topic: "UNION",
    title: "Combine Employee and Customer Names",
    prompt: "Combine names from `employees` (retrieved as `name`) and `customers` (retrieved as `customer_name`) into a single output column named `all_names`. Sort the combined list alphabetically.",
    starterCode: "-- Combine names using UNION\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 13, msg: "Combined set must contain exactly 13 names (8 employees + 5 customers)" },
      { rule: (result) => result && result[0].values[0][0] === 'Alice Smith', msg: "Names must be sorted alphabetically ascending" }
    ],
    hint: "Use SELECT name AS all_names FROM employees UNION SELECT customer_name AS all_names FROM customers ORDER BY all_names;",
    solution: "SELECT name AS all_names FROM employees UNION SELECT customer_name AS all_names FROM customers ORDER BY all_names;",
    difficulty: "medium"
  },
  {
    id: "sql-left-join-null-38",
    chapter: 10,
    topic: "JOINS & NULLs",
    title: "Customers with No Orders",
    prompt: "Identify customers who have never placed an order. Return their `customer_name` using a `LEFT JOIN` and checking for `NULL` order details.",
    starterCode: "-- Customers with no orders\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 0, msg: "All mock customers have orders in our seed dataset, so this should return an empty result" }
    ],
    hint: "Use LEFT JOIN and WHERE orders.order_id IS NULL.",
    solution: "SELECT c.customer_name FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;",
    difficulty: "medium"
  },
  {
    id: "sql-view-creation-39",
    chapter: 13,
    topic: "Subqueries & Views",
    title: "Employee Salary Rankings View",
    prompt: "Find employee names and their salaries for employees earning more than the salary of Bob Jones (which is 72,000).",
    starterCode: "-- Find employees earning more than Bob Jones\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 4, msg: "Exactly 4 employees earn more than Bob Jones" }
    ],
    hint: "Use subquery for Bob Jones salary: WHERE salary > (SELECT salary FROM employees WHERE name = 'Bob Jones').",
    solution: "SELECT name, salary FROM employees WHERE salary > (SELECT salary FROM employees WHERE name = 'Bob Jones');",
    difficulty: "medium"
  },
  {
    id: "sql-dense-rank-40",
    chapter: 18,
    topic: "Window Functions",
    title: "Dense Rank Salaries",
    prompt: "Compute a dense rank of employee salaries across the entire company. Retrieve `name`, `salary`, and the rank as `salary_rank` sorted by rank ascending (the highest salary gets rank 1).",
    starterCode: "-- Rank salaries with DENSE_RANK()\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][0] === 'Henry Ford' && result[0].values[0][2] === 1, msg: "Henry Ford must have rank 1" }
    ],
    hint: "Use DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_rank.",
    solution: "SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;",
    difficulty: "hard"
  },
  {
    id: "sql-coalesce-null-date-41",
    chapter: 10,
    topic: "NULL Handling",
    title: "Coalesce Null Hire Dates",
    prompt: "Check employee names and hire dates. If hire_date is NULL (none are NULL in our seeds, but we check for robust queries), replace it with 'Not Defined' and name the column `hired_on`.",
    starterCode: "-- Coalesce hire_date\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('hired_on'), msg: "Result column must be named 'hired_on'" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Must return all 8 employees" }
    ],
    hint: "Use COALESCE(hire_date, 'Not Defined') AS hired_on.",
    solution: "SELECT name, COALESCE(hire_date, 'Not Defined') AS hired_on FROM employees;",
    difficulty: "easy"
  },
  {
    id: "sql-except-customers-42",
    chapter: 5,
    topic: "UNION / INTERSECT",
    title: "Shared Cities (INTERSECT)",
    prompt: "Retrieve a list of cities that exist in both the `customers` table (under `city`) and the `departments` table (under `location`) using the INTERSECT operator.",
    starterCode: "-- Find shared locations using INTERSECT\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 3, msg: "Exactly 3 locations are shared: New York, London, and Paris" }
    ],
    hint: "Use SELECT city FROM customers INTERSECT SELECT location FROM departments.",
    solution: "SELECT city FROM customers INTERSECT SELECT location FROM departments;",
    difficulty: "medium"
  },
  {
    id: "sql-lag-order-43",
    chapter: 18,
    topic: "Window Functions",
    title: "Lagging Order Amounts",
    prompt: "Retrieve the `order_id`, `customer_id`, `total_amount`, and the previous order's amount for that customer as `prev_order_amount` sorted by `order_id` ascending. Use the LAG window function partitioned by `customer_id` and ordered by `order_id`.",
    starterCode: "-- Use LAG window function\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('prev_order_amount'), msg: "Output column must be named 'prev_order_amount'" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 9003 && row[3] === 12000.5), msg: "Order 9003 must show the previous order amount of 12000.5 for customer 501" }
    ],
    hint: "Use LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_id) AS prev_order_amount.",
    solution: "SELECT order_id, customer_id, total_amount, LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_id) AS prev_order_amount FROM orders;",
    difficulty: "hard"
  },
  {
    id: "sql-lead-order-44",
    chapter: 18,
    topic: "Window Functions",
    title: "Leading Order Dates",
    prompt: "For each order, retrieve the `order_id`, `order_date`, and the next order date across all orders as `next_order_date` using the LEAD window function ordered by `order_id`.",
    starterCode: "-- Use LEAD window function\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][2] === '2023-10-03', msg: "Next order date after 2023-10-01 is 2023-10-03" }
    ],
    hint: "Use LEAD(order_date) OVER (ORDER BY order_id) AS next_order_date.",
    solution: "SELECT order_id, order_date, LEAD(order_date) OVER (ORDER BY order_id) AS next_order_date FROM orders;",
    difficulty: "hard"
  },
  {
    id: "sql-salary-stats-45",
    chapter: 9,
    topic: "HAVING Clause",
    title: "High Salary Departments Filter",
    prompt: "Find the `dept_id` and the average employee salary as `avg_salary` for departments where the average salary is greater than 80,000, sorted by `avg_salary` descending.",
    starterCode: "-- Filter groups with HAVING\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 3, msg: "Exactly 3 departments have an average salary > 80,000" },
      { rule: (result) => result && result[0].values[0][1] === 125000, msg: "Department 5 has the highest average salary (125,000)" }
    ],
    hint: "Group by dept_id, select AVG(salary) as avg_salary, and filter using HAVING avg_salary > 80000.",
    solution: "SELECT dept_id, AVG(salary) AS avg_salary FROM employees GROUP BY dept_id HAVING AVG(salary) > 80000 ORDER BY avg_salary DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-length-names-46",
    chapter: 16,
    topic: "String Wildcards & Concatenation",
    title: "Name Character Lengths",
    prompt: "Select the employee name, and the character length of their name as `name_length` for all employees whose name is longer than 10 characters.",
    starterCode: "-- Use LENGTH() function\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "Exactly 5 employees have names longer than 10 characters" }
    ],
    hint: "Use SELECT name, LENGTH(name) AS name_length FROM employees WHERE LENGTH(name) > 10;",
    solution: "SELECT name, LENGTH(name) AS name_length FROM employees WHERE LENGTH(name) > 10;",
    difficulty: "easy"
  },
  {
    id: "sql-lower-emails-47",
    chapter: 16,
    topic: "String Wildcards & Concatenation",
    title: "Lower Case City Match",
    prompt: "Find customer names and countries for customers in 'london' or 'tokyo', but perform a case-insensitive check by converting the `city` column to lower case in the WHERE clause.",
    starterCode: "-- Case-insensitive city matching\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 2, msg: "Exactly 2 customers are located in London or Tokyo" }
    ],
    hint: "Use LOWER(city) IN ('london', 'tokyo').",
    solution: "SELECT customer_name, country FROM customers WHERE LOWER(city) IN ('london', 'tokyo');",
    difficulty: "easy"
  },
  {
    id: "sql-avg-order-range-48",
    chapter: 14,
    topic: "Conditional CASE Statements",
    title: "Orders Value Classification",
    prompt: "Retrieve each `order_id`, `total_amount`, and a column named `value_category` showing: 'High Value' if the amount is >= 10,000, 'Medium Value' if it is >= 5,000 and < 10,000, and 'Low Value' otherwise. Sort by `total_amount` descending.",
    starterCode: "-- Categorize order values with CASE\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 7, msg: "Must return all 7 orders" },
      { rule: (result) => result && result[0].values[0][2] === 'High Value', msg: "Top order 9004 must be classified as 'High Value'" }
    ],
    hint: "Use CASE WHEN total_amount >= 10000 THEN 'High Value' ... END AS value_category.",
    solution: "SELECT order_id, total_amount, CASE WHEN total_amount >= 10000 THEN 'High Value' WHEN total_amount >= 5000 THEN 'Medium Value' ELSE 'Low Value' END AS value_category FROM orders ORDER BY total_amount DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-revenue-by-country-49",
    chapter: 7,
    topic: "E-Commerce Schema & Filtering",
    title: "Revenue by Customer Country",
    prompt: "Compute the sum of order amounts as `total_revenue` for each customer `country`. Retrieve `country` and `total_revenue` ordered by revenue descending.",
    starterCode: "-- Group orders by country\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][0] === 'USA' && result[0].values[0][1] === 15200.5, msg: "USA has highest revenue (15200.5)" }
    ],
    hint: "INNER JOIN orders, customers on customer_id, group by country, SUM(total_amount).",
    solution: "SELECT c.country, SUM(o.total_amount) AS total_revenue FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.country ORDER BY total_revenue DESC;",
    difficulty: "medium"
  },
  {
    id: "sql-round-salaries-50",
    chapter: 14,
    topic: "Conditional CASE Statements",
    title: "Company Salary Stats Summary",
    prompt: "Retrieve the average salary of all employees rounded to the nearest integer as `rounded_avg_salary`, and the maximum salary as `max_salary` in a single row summary.",
    starterCode: "-- Round average salary\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values[0][0] === 89286, msg: "Average company salary rounded is 89,286" },
      { rule: (result) => result && result[0].values[0][1] === 125000, msg: "Maximum salary is 125,000" }
    ],
    hint: "Use ROUND(AVG(salary)) AS rounded_avg_salary, MAX(salary) AS max_salary.",
    solution: "SELECT ROUND(AVG(salary)) AS rounded_avg_salary, MAX(salary) AS max_salary FROM employees;",
    difficulty: "medium"
  },
  {
    id: "sql-window-lead-lag-51",
    chapter: 18,
    topic: "Window Functions",
    title: "Order Amount Lead and Difference",
    prompt: "For each order in the `orders` table, retrieve the `order_id`, the current `total_amount`, the next order's total amount as `next_order_amount` (using the `LEAD` window function ordered by `order_id`), and the difference between them as `amount_difference` (`next_order_amount` minus `total_amount`). Sort by `order_id` ascending.",
    starterCode: "-- Calculate next order amount and the difference\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].columns.includes('next_order_amount') && result[0].columns.includes('amount_difference'), msg: "Output columns must include next_order_amount and amount_difference" },
      { rule: (result) => result && result[0].values.length === 7, msg: "Must return all 7 orders" },
      { rule: (result) => result && Math.abs(result[0].values[0][3] - (-6600.50)) < 0.01, msg: "Order 9001 must show the correct amount difference of -6600.50" }
    ],
    hint: "Use LEAD(total_amount) OVER (ORDER BY order_id) AS next_order_amount, and subtract total_amount from that expression for amount_difference.",
    solution: "SELECT order_id, total_amount, LEAD(total_amount) OVER (ORDER BY order_id) AS next_order_amount, (LEAD(total_amount) OVER (ORDER BY order_id) - total_amount) AS amount_difference FROM orders;",
    difficulty: "hard"
  },
  {
    id: "sql-window-dense-rank-52",
    chapter: 18,
    topic: "Window Functions",
    title: "Rank Salaries Within Departments",
    prompt: "Retrieve the `dept_id`, employee `name`, `salary`, and their rank within their department as `dept_salary_rank` using `DENSE_RANK()`. Employees with higher salaries in each department should be ranked first (rank 1). Order the output by `dept_id` ascending and `salary` descending.",
    starterCode: "-- Rank employees by salary within their department\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 8, msg: "Must return all 8 employees" },
      { rule: (result) => result && result[0].values[0][0] === 1 && result[0].values[0][1] === 'Alice Smith' && result[0].values[0][3] === 1, msg: "Alice Smith in Dept 1 must have rank 1" },
      { rule: (result) => result && result[0].values[2][0] === 1 && result[0].values[2][1] === 'Grace Kelly' && result[0].values[2][3] === 3, msg: "Grace Kelly in Dept 1 must have rank 3" }
    ],
    hint: "Use DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_salary_rank.",
    solution: "SELECT dept_id, name, salary, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_salary_rank FROM employees ORDER BY dept_id ASC, salary DESC;",
    difficulty: "hard"
  },
  {
    id: "sql-subquery-all-53",
    chapter: 15,
    topic: "Subqueries & Views",
    title: "Products Priced Above All Furniture",
    prompt: "Find the `product_name` and `price` of all products that are more expensive than ALL products in the 'Furniture' category. Use a subquery to find the prices of Furniture products.",
    starterCode: "-- Find products more expensive than all furniture items\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 2, msg: "Exactly 2 products (Laptop and Monitor) must be returned" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Laptop') && result[0].values.some(row => row[0] === 'Monitor'), msg: "Result must include Laptop and Monitor" },
      { rule: (result) => result && !result[0].values.some(row => row[0] === 'Office Chair'), msg: "Office Chair should not be returned as it is not more expensive than itself" }
    ],
    hint: "Use price > (SELECT MAX(price) FROM products WHERE category = 'Furniture').",
    solution: "SELECT product_name, price FROM products WHERE price > (SELECT MAX(price) FROM products WHERE category = 'Furniture');",
    difficulty: "medium"
  },
  {
    id: "sql-self-join-managers-54",
    chapter: 17,
    topic: "Self Joins",
    title: "Find Employee Managers",
    prompt: "For all employees whose departments have a manager assigned, retrieve their name as `employee_name`, their `dept_name`, and their manager's name as `manager_name`. You will need to join `employees` to `departments`, and then join `departments` back to `employees` as a self-join to retrieve the manager's name.",
    starterCode: "-- Self join to find managers\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 7, msg: "Exactly 7 employees belong to departments with assigned managers" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Bob Jones' && row[2] === 'Alice Smith'), msg: "Bob Jones's manager must be Alice Smith" },
      { rule: (result) => result && result[0].values.some(row => row[0] === 'Emma White' && row[2] === 'Charlie Brown'), msg: "Emma White's manager must be Charlie Brown" }
    ],
    hint: "Join employees e with departments d on e.dept_id = d.dept_id, and then join departments d with employees m on d.manager_id = m.emp_id.",
    solution: "SELECT e.name AS employee_name, d.dept_name, m.name AS manager_name FROM employees e INNER JOIN departments d ON e.dept_id = d.dept_id INNER JOIN employees m ON d.manager_id = m.emp_id;",
    difficulty: "medium"
  },
  {
    id: "sql-coalesce-default-names-55",
    chapter: 8,
    topic: "NULL Handling",
    title: "Department Manager ID Fallback",
    prompt: "For each department in the `departments` table, retrieve the `dept_name` and the `manager_id`. If the department doesn't have a manager (`manager_id` is `NULL`), return `-1` instead. Alias this column as `assigned_manager` and sort the output by `dept_name` alphabetically.",
    starterCode: "-- Use COALESCE to provide a manager ID fallback\n",
    checks: [
      { rule: (result) => result && result.length > 0, msg: "Query must return a result" },
      { rule: (result) => result && result[0].values.length === 5, msg: "Must return all 5 departments" },
      { rule: (result) => result && result[0].values[1][0] === 'Finance' && result[0].values[1][1] === -1, msg: "Finance department must have an assigned_manager of -1" },
      { rule: (result) => result && result[0].columns.includes('assigned_manager'), msg: "Result column must be named 'assigned_manager'" }
    ],
    hint: "Use COALESCE(manager_id, -1) AS assigned_manager and ORDER BY dept_name ASC.",
    solution: "SELECT dept_name, COALESCE(manager_id, -1) AS assigned_manager FROM departments ORDER BY dept_name ASC;",
    difficulty: "easy"
  }
];

