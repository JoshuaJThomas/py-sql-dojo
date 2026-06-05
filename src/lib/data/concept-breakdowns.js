/**
 * Concept Breakdowns for Python & SQL topics
 * Used to power the side-by-side Interactive study guide.
 */

const breakdowns = {
  // --- PYTHON CONCEPTS ---
  "python basics": {
    title: "Variables and String Assignment",
    desc: "In Python, variables are dynamically typed containers. You assign values to them using the `=` operator without declaring their type.",
    diagram: `[Value: "Hello, World!"] (String Object)
       ▲
       │  (Assignment via '=')
 [Variable: result]`,
    keyPoints: [
      "Strings can be enclosed in single quotes (') or double quotes (\").",
      "No semicolons (;) are required at the end of statements.",
      "Python variables are labels pointing to objects in memory."
    ],
    example: "result = 'Hello, World!'\nprint(result) # Output: Hello, World!",
    quiz: {
      question: "What is the result of executing `x = 5; y = x; x = 10; print(y)` in Python?",
      options: ["10", "5", "NameError", "None"],
      answer: 1,
      explanation: "Python variables point to objects. When `y = x` runs, `y` points to the object `5`. Modifying `x` to point to `10` does not alter what `y` points to."
    }
  },

  "arithmetic operators": {
    title: "Arithmetic Operations & Tuples",
    desc: "Python supports standard arithmetic: Addition (+), Subtraction (-), and Multiplication (*). Results can be packed into an immutable tuple structure `(x, y, z)`.",
    diagram: `Operands:  a = 15,  b = 4
 
Addition       a + b  ──► 19
Subtraction    a - b  ──► 11   ──► Packed into Tuple: (19, 11, 60)
Multiplication a * b  ──► 60`,
    keyPoints: [
      "Tuples are defined using parentheses `()` and separated by commas.",
      "Tuples are immutable, meaning they cannot be modified after creation.",
      "They are useful for returning multiple values from a single block."
    ],
    example: "a = 15\nb = 4\nresult = (a + b, a - b, a * b) # (19, 11, 60)",
    quiz: {
      question: "Which of the following creates a tuple with a single element in Python?",
      options: ["(5)", "(5,)", "tuple(5)", "[5]"],
      answer: 1,
      explanation: "To define a single-element tuple, you must include a trailing comma, e.g. `(5,)`. Without it, Python parses the parentheses as normal expression grouping, resulting in an integer."
    }
  },

  "division": {
    title: "Floor Division vs Float Division",
    desc: "Python provides two division operators: `/` for standard float division, and `//` for floor division (which discards the fractional part).",
    diagram: `Numerator: 21, Denominator: 5
 
Standard Division (/) ──► 21 / 5  ──► 4.2 (Float)
Floor Division (//)    ──► 21 // 5 ──► 4   (Integer, rounded down)`,
    keyPoints: [
      "True Division (`/`) always returns a floating-point number.",
      "Floor Division (`//`) rounds down to the nearest mathematical integer.",
      "Modulo (`%`) returns the remainder of the floor division (e.g. `21 % 5 = 1`)."
    ],
    example: "float_div = 21 / 5   # 4.2\nfloor_div = 21 // 5  # 4\nremainder = 21 % 5   # 1",
    quiz: {
      question: "What does `-11 // 3` evaluate to in Python?",
      options: ["-3", "-3.66", "-4", "-3.0"],
      answer: 2,
      explanation: "Floor division `//` rounds down towards negative infinity. `-11 / 3` is `-3.66...`, which floors down to `-4`."
    }
  },

  "functions & logic": {
    title: "Functions and Conditional logic",
    desc: "Functions are declared using the `def` keyword. Code blocks are structured using strictly enforced whitespace indentation.",
    diagram: `def check_status(val):
┌───────────────────────────────┐
│ if val > 10:                  │ ◄── Indented 4 spaces
│     return "High"             │ ◄── Indented 8 spaces
│ else:                         │
│     return "Low"              │
└───────────────────────────────┘`,
    keyPoints: [
      "Logical operators: `and`, `or`, `not` are used for conditionals.",
      "Modulo check `year % 4 == 0` evaluates if a number is divisible by 4.",
      "Returning functions: Assigning a function name without `()` references the callable itself."
    ],
    example: "def is_even(num):\n    return num % 2 == 0\n\nresult = is_even # Assign reference",
    quiz: {
      question: "What does `type(func)` return if `func` is defined as `def func(): pass`?",
      options: ["<class 'function'>", "<class 'NoneType'>", "<class 'type'>", "SyntaxError"],
      answer: 0,
      explanation: "In Python, functions are first-class objects. Referencing `func` without parentheses returns the function object itself, which belongs to the class `function`."
    }
  },

  "lists": {
    title: "Python Lists & Unique Sorting",
    desc: "Lists are mutable sequences. A common pattern to extract unique sorted records is to cast a list to a `set` (which removes duplicates) and sort it.",
    diagram: `Raw List: [5, 7, 6, 7, 8, 8]
             │   (Cast to set)
             ▼
Uniques:  {5, 6, 7, 8}
             │   (Sorted)
             ▼
Sorted:   [5, 6, 7, 8]  ──► Index [-2] is 7 (Runner-up)`,
    keyPoints: [
      "`set(list)` discards all duplicate items instantly.",
      "`sorted()` returns a new sorted list ascending.",
      "Index `[-1]` accesses the largest, `[-2]` accesses the second-largest."
    ],
    example: "scores = [3, 5, 5, 4]\nuniques = sorted(list(set(scores))) # [3, 4, 5]\nrunner_up = uniques[-2] # 4",
    quiz: {
      question: "If `a = [1, 2, 3]` and `b = a`, what is `a` after running `b.append(4)`?",
      options: ["[1, 2, 3]", "[1, 2, 3, 4]", "AttributeError", "[4]"],
      answer: 1,
      explanation: "Lists are mutable. Since `b = a` points to the exact same list object in memory, modifying `b` via `.append()` also alters the list accessed through `a`."
    }
  },

  "list comprehension": {
    title: "Vectorized List Comprehensions",
    desc: "List comprehensions offer a concise syntax to create a new list by applying expressions on elements of an existing iterable.",
    diagram: `Syntax: [ expression  for  item  in  iterable  if  condition ]
               │             │            │            │
             Output        Value        Source       Filter`,
    keyPoints: [
      "Significantly faster than standard `for` loops due to internal C-level optimization.",
      "Conditionals are optional but provide inline filtering.",
      "Squaring syntax is `x ** 2` or `pow(x, 2)`."
    ],
    example: "nums = [1, 2, 3, 4]\nresult = [x**2 for x in nums if x % 2 != 0] # [1, 9]",
    quiz: {
      question: "What is the output of `[x for x in range(3) if x % 2 == 0]`?",
      options: ["[0, 2]", "[0, 1, 2]", "[2]", "[1]"],
      answer: 0,
      explanation: "`range(3)` produces `0, 1, 2`. The filter `x % 2 == 0` keeps only the even numbers, which are `0` and `2`."
    }
  },

  "strings": {
    title: "String Formatting & Manipulation",
    desc: "Strings are immutable sequences of characters. Formatting can be achieved cleanly using f-strings (`f'Hello {var}'`).",
    diagram: `name = "Alice",  score = 95
Format Pattern: f"Student: {name} scored {score}%"
                      │          │
                      ▼          ▼
Result String:  "Student: Alice scored 95%"`,
    keyPoints: [
      "f-strings allow embedding expressions inside curly brackets `{}`.",
      "Strings support methods like `.lower()`, `.upper()`, `.split()`, and `.strip()`.",
      "Path extraction is best handled using the `pathlib` module."
    ],
    example: "user = \"Sensei\"\nmsg = f\"Welcome back, {user}!\" # \"Welcome back, Sensei!\"",
    quiz: {
      question: "Which string method removes both leading and trailing whitespace?",
      options: [".trim()", ".strip()", ".clean()", ".replace(' ', '')"],
      answer: 1,
      explanation: "Python uses `.strip()` to clean leading and trailing whitespace. `.trim()` is used in Javascript/Java but does not exist in Python."
    }
  },

  "regular expressions": {
    title: "Regex Pattern Matching",
    desc: "The `re` module provides tools to search, extract, and substitute substrings based on structural regular expression patterns.",
    diagram: `Pattern: r'\\d+' (Match one or more digits)
Text:    "ID: 4509, Name: Bob"
             ▲
             │ (re.findall)
Result:  ['4509']`,
    keyPoints: [
      "`re.findall(pattern, text)` returns a list of all matching patterns.",
      "`re.sub(pattern, replacement, text)` replaces matches with a new string.",
      "Use raw strings `r'...'` to define regex patterns to avoid escaping backslashes."
    ],
    example: "import re\ntext = \"Vitals: 120 bpm\"\nbpm = re.findall(r'\\d+', text)[0] # \"120\"",
    quiz: {
      question: "In Python's `re` module, what does the pattern `r'\\d+'` match?",
      options: ["One or more digits", "Any word characters", "Only whitespace", "Exactly one digit"],
      answer: 0,
      explanation: "`\\d` matches any decimal digit, and the `+` quantifier matches one or more repetitions of the preceding character."
    }
  },

  "numpy": {
    title: "NumPy Vectorized Arrays",
    desc: "NumPy provides high-performance N-dimensional arrays (`ndarrays`) that execute calculations via pre-compiled C routines.",
    diagram: `Array Element-wise operations:
[ 1, 2, 3, 4 ]   *   3
  │  │  │  │
  ▼  ▼  ▼  ▼
[ 3, 6, 9, 12 ]`,
    keyPoints: [
      "Vectorization avoids writing nested loops for array arithmetic.",
      "Arrays must contain elements of the same datatype.",
      "Common aggregations: `np.mean()`, `np.median()`, `np.std()`, `np.dot()`."
    ],
    example: "import numpy as np\narr = np.array([10, 20, 30])\nmean = np.mean(arr) # 20.0",
    quiz: {
      question: "What happens when you execute `np.array([1, 2]) * np.array([3, 4])`?",
      options: ["Matrix dot product: 11", "Element-wise multiplication: [3, 8]", "ValueError: Size mismatch", "TypeError"],
      answer: 1,
      explanation: "NumPy arrays perform element-wise arithmetic by default when using the `*` operator, yielding `[1*3, 2*4]` which is `[3, 8]`."
    }
  },

  "pandas": {
    title: "Pandas DataFrames",
    desc: "Pandas provides DataFrames (two-dimensional labeled tables) and Series (one-dimensional arrays) for data cleaning and analysis.",
    diagram: `DataFrame structure:
    index  |  name   |  sales
   ────────┼─────────┼────────
      0    |  Alice  |  1200
      1    |  Bob    |  850

GroupBy Operation: df.groupby('department').sum()`,
    keyPoints: [
      "Use `.groupby()` to aggregate records based on shared category keys.",
      "Use `.loc[]` and `.iloc[]` for label-based and integer-based slicing.",
      "Casting outputs: Use `df.to_dict()` or `df.values.tolist()` to export data."
    ],
    example: "import pandas as pd\ndf = pd.DataFrame({'val': [1, 2, 3]})\nsum_val = df['val'].sum() # 6",
    quiz: {
      question: "How do you select rows in a Pandas DataFrame `df` where the column 'A' is greater than 5?",
      options: ["df.filter(A > 5)", "df[df['A'] > 5]", "df.select('A' > 5)", "df.where('A' > 5)"],
      answer: 1,
      explanation: "Boolean indexing `df[df['A'] > 5]` is the standard way to filter rows in a Pandas DataFrame."
    }
  },

  "scikit-learn": {
    title: "Machine Learning (Estimator API)",
    desc: "Scikit-Learn implements standard ML algorithms (SVM, KNN, PCA, Linear Regression) using a unified `fit()` and `predict()` API.",
    diagram: `Raw Data (X) ──► Estimator.fit(X, y) ──► Trained Model
                                               │
New Data (X_test) ──► Estimator.predict(X_test) ──► Predictions`,
    keyPoints: [
      "Use `.fit(X, y)` to train models on feature matrix `X` and target vector `y`.",
      "Use `.transform(X)` or `.fit_transform(X)` for scaling/dimensionality reductions.",
      "Support Vector Machines (SVM) classify items by finding the optimal dividing hyperplane."
    ],
    example: "from sklearn.svm import SVC\nclf = SVC()\nclf.fit(X_train, y_train)\npreds = clf.predict(X_test)",
    quiz: {
      question: "Which method is used in Scikit-Learn to fit a model and make predictions in a single step?",
      options: [".fit_predict()", ".train_predict()", ".run()", ".fit_transform()"],
      answer: 0,
      explanation: "Estimators like clustering algorithms or some classifiers support `.fit_predict(X)` to fit the model and return predictions in one step."
    }
  },

  // --- SQL CONCEPTS ---
  "select & filters": {
    title: "SQL SELECT and WHERE Filters",
    desc: "SQL queries fetch fields from tables. The `WHERE` clause filters rows based on conditional boolean checks.",
    diagram: `Table: Employees
id | name  | department | salary
───┼───────┼────────────┼───────
1  | Alice | Tech       | 90000
2  | Bob   | HR         | 65000

Query: SELECT name FROM Employees WHERE department = 'Tech';
Result: ['Alice']`,
    keyPoints: [
      "`SELECT *` fetches all columns; specify column names to optimize performance.",
      "Logical operators: `AND`, `OR`, `NOT`, and comparisons `=`, `>`, `<`, `!=` are supported.",
      "`LIMIT n` bounds the output to a maximum of `n` rows."
    ],
    example: "SELECT name, salary FROM employees\nWHERE salary > 70000\nLIMIT 5;",
    quiz: {
      question: "In SQL, which operator is used for pattern matching using wildcards?",
      options: ["MATCH", "LIKE", "CONTAINS", "IN"],
      answer: 1,
      explanation: "The `LIKE` operator is used with `%` (zero or more chars) and `_` (exactly one char) for wildcard-based pattern matching."
    }
  },

  "joins": {
    title: "SQL INNER & LEFT OUTER JOINs",
    desc: "JOINs combine rows from two or more tables based on a related key column matching primary and foreign definitions.",
    diagram: `  [orders]              [customers]
id | cust_id | amount    id | name
───┼─────────┼───────    ───┼───────
1  | 10      | 250.00    10 | Alice
2  | 20      | 90.00     30 | Charlie

Query: orders INNER JOIN customers ON orders.cust_id = customers.id
Result matching: order 1 (cust_id 10) joins Alice (id 10). (Bob/id 20 missing)`,
    keyPoints: [
      "`INNER JOIN` returns records only when the join key matches in both tables.",
      "`LEFT JOIN` returns all rows from the left table, and matched rows from the right table (NULL if no match).",
      "Always qualify join columns: `orders.customer_id = customers.id`."
    ],
    example: "SELECT o.id, c.name, o.amount\nFROM orders o\nJOIN customers c ON o.customer_id = c.id;",
    quiz: {
      question: "What values will columns from the right table have in a `LEFT JOIN` if no match is found on the join key?",
      options: ["0", "Empty string ''", "NULL", "An error is thrown"],
      answer: 2,
      explanation: "A `LEFT JOIN` guarantees all rows from the left table are returned. If a row has no matching key on the right table, columns from the right table are filled with `NULL`."
    }
  },

  "group by": {
    title: "SQL Aggregations & GROUP BY",
    desc: "GROUP BY partitions rows into summary groups. Aggregations (`COUNT()`, `SUM()`, `AVG()`) run calculations over partitions.",
    diagram: `Table Rows:
Dept | Emp  | Salary
─────┼──────┼───────
HR   | Bob  | 5000
Tech | Jack | 8000
Tech | Jill | 9000

Group BY Dept:
HR   ──► [5000]          ──► AVG() = 5000
Tech ──► [8000, 9000]    ──► AVG() = 8500`,
    keyPoints: [
      "Every non-aggregated column in the `SELECT` list must appear in the `GROUP BY` clause.",
      "Use `HAVING` (instead of `WHERE`) to filter aggregated summary rows.",
      "Use `COUNT(DISTINCT col)` to calculate unique values in partitions."
    ],
    example: "SELECT department, COUNT(*) as emp_count, AVG(salary) as avg_sal\nFROM employees\nGROUP BY department\nHAVING avg_sal > 60000;",
    quiz: {
      question: "Which SQL clause is used to filter group results after grouping has occurred?",
      options: ["WHERE", "HAVING", "FILTER", "LIMIT"],
      answer: 1,
      explanation: "The `HAVING` clause filters aggregated group results, while `WHERE` filters individual rows before grouping."
    }
  },

  "ctes": {
    title: "Common Table Expressions (CTEs)",
    desc: "A Common Table Expression (CTE) defines a temporary named result set that can be referenced within a larger SELECT query.",
    diagram: `WITH tech_dept AS (
  SELECT * FROM employees WHERE department = 'Tech'
)
SELECT name, salary FROM tech_dept  ◄── References temporary result set
WHERE salary > 80000;`,
    keyPoints: [
      "CTEs make complex query definitions readable and maintainable.",
      "Declared using the `WITH` keyword followed by the CTE query name.",
      "Can be combined: `WITH cte1 AS (...), cte2 AS (...) SELECT ...`."
    ],
    example: "WITH high_earners AS (\n  SELECT * FROM employees WHERE salary > 90000\n)\nSELECT department, COUNT(*) FROM high_earners\nGROUP BY department;",
    quiz: {
      question: "What keyword is used to start a Common Table Expression (CTE) in SQL?",
      options: ["WITH", "CREATE CTE", "DEFINE", "AS"],
      answer: 0,
      explanation: "A CTE is defined using the `WITH` keyword, followed by the CTE name, `AS`, and the subquery in parentheses."
    }
  },

  "case statements": {
    title: "Conditional SELECT with CASE",
    desc: "The `CASE` expression acts as an inline if-else conditional inside query SELECT projections.",
    diagram: `Column: salary (85000)

CASE 
  WHEN salary >= 100000 THEN 'Tier 1'
  WHEN salary >= 80000  THEN 'Tier 2'  ──► Evaluated output: 'Tier 2'
  ELSE 'Tier 3'
END as salary_tier`,
    keyPoints: [
      "Evaluates conditionals sequentially; exits on the first match.",
      "Must always close with the `END` keyword.",
      "Can be placed inside aggregation functions (e.g., `SUM(CASE WHEN...)`)."
    ],
    example: "SELECT name,\n  CASE WHEN department = 'Tech' THEN salary * 1.1\n       ELSE salary * 1.05\n  END as proposed_salary\nFROM employees;",
    quiz: {
      question: "What happens if no `WHEN` condition is met in a SQL `CASE` statement and there is no `ELSE` clause?",
      options: ["Throws an error", "Returns 0", "Returns NULL", "Returns the first column value"],
      answer: 2,
      explanation: "If no conditions match and no `ELSE` clause is specified, SQL default evaluates the `CASE` statement as `NULL`."
    }
  },

  "window functions": {
    title: "SQL Window Functions",
    desc: "Window functions calculate values across a set of table rows that are related to the current row, without collapsing them.",
    diagram: `Partition: Tech Department
Current Row | Salary | ROW_NUMBER() OVER (ORDER BY Salary DESC)
────────────┼────────┼────────────────────────────────────────
Jack        | 9000   | 1  (Highest in partition)
Jill        | 8000   | 2  (Second highest)
John        | 7000   | 3`,
    keyPoints: [
      "Declared using the `OVER` clause, specifying `PARTITION BY` and `ORDER BY` filters.",
      "Maintains the identity of individual rows (unlike `GROUP BY` aggregates).",
      "Common functions: `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LAG()`, `LEAD()`."
    ],
    example: "SELECT name, department, salary,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank\nFROM employees;",
    quiz: {
      question: "What is the key difference between `RANK()` and `DENSE_RANK()`?",
      options: ["RANK() has no ordering", "DENSE_RANK() does not skip ranks for duplicate values", "RANK() partitions data automatically", "DENSE_RANK() only works on numbers"],
      answer: 1,
      explanation: "When values tie, both rank them identically, but `RANK()` leaves gaps in the rank sequence (e.g. 1, 2, 2, 4), whereas `DENSE_RANK()` does not leave gaps (e.g. 1, 2, 2, 3)."
    }
  }
};

/**
 * Fallback generator for unmapped topics
 */
export function getConceptBreakdown(topic, id) {
  const normalized = (topic || "").toLowerCase().trim();
  
  // Find match in definitions
  if (breakdowns[normalized]) {
    return breakdowns[normalized];
  }
  
  // Fuzzy match on substrings
  for (const [key, val] of Object.entries(breakdowns)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }

  // Fallback default structure
  return {
    title: `Concept: ${topic || "Dojo Practice"}`,
    desc: "This challenge explores programmatic constructs in Python or relational calculations in SQL SQLite.",
    diagram: `[Active Code/Query] ──► [Evaluator Sandbox] ──► [Unit Checklists]
                                                    │
                                                    └──► [Telemetry XP]`,
    keyPoints: [
      "Review instructions carefully to understand inputs and outputs.",
      "Run your script using the Run button to verify console prints.",
      "Check the checklist panel for failing validation assertion lines."
    ],
    example: id ? `# Active exercise id: ${id}` : "",
    quiz: {
      question: "Which of the following is the main query engine used for SQL in the Gemini Dojo?",
      options: ["MySQL", "SQLite", "PostgreSQL", "MongoDB"],
      answer: 1,
      explanation: "Gemini Dojo runs standard SQL syntax inside an in-browser SQLite database instance powered by SQL.js."
    }
  };
}
