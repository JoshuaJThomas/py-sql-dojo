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
  }
];
