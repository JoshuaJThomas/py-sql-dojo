export const pythonExercises = [
  // --- PYTHON BASICS (HackerRank & Jose Portilla Crash Course) ---
  {
    id: "ch01-hello-world-01",
    chapter: 1,
    topic: "python basics",
    title: "Say Hello World",
    prompt: "Assign the string 'Hello, World!' to the variable `result`.",
    starterCode: "# Assign 'Hello, World!' to result\nresult = ...",
    prelude: "",
    checks: [
      { test: "result == 'Hello, World!'", msg: "result must be equal to 'Hello, World!'" }
    ],
    hint: "Use quotes to define a string: result = 'Hello, World!'",
    solution: "result = 'Hello, World!'",
    difficulty: "easy"
  },
  {
    id: "ch01-arithmetic-02",
    chapter: 1,
    topic: "arithmetic operators",
    title: "Basic Arithmetic",
    prompt: "Given variables `a` and `b`, calculate their sum, difference, and product. Assign the tuple `(sum, diff, product)` to `result`.",
    starterCode: "# a and b are integers pre-defined in scope\n# result = (a+b, a-b, a*b)\nresult = ...",
    prelude: "a = 15\nb = 4",
    checks: [
      { test: "isinstance(result, tuple)", msg: "result must be a tuple" },
      { test: "result == (19, 11, 60)", msg: "result must match the sum, diff, and product of 15 and 4" }
    ],
    hint: "Use operators +, -, and * inside a tuple.",
    solution: "result = (a + b, a - b, a * b)",
    difficulty: "easy"
  },
  {
    id: "ch01-division-03",
    chapter: 1,
    topic: "division",
    title: "Integer vs Float Division",
    prompt: "Given variables `a` and `b`, perform integer division (floor division) and float division (true division). Assign the tuple `(integer_div, float_div)` to `result`.",
    starterCode: "# a and b are integers pre-defined in scope\n# result = ...",
    prelude: "a = 21\nb = 5",
    checks: [
      { test: "isinstance(result, tuple)", msg: "result must be a tuple" },
      { test: "result == (4, 4.2)", msg: "result must match integer division (4) and float division (4.2)" }
    ],
    hint: "Use // for integer division and / for float division.",
    solution: "result = (a // b, a / b)",
    difficulty: "easy"
  },
  {
    id: "ch01-leap-year-04",
    chapter: 1,
    topic: "functions & logic",
    title: "Leap Year Checker",
    prompt: "Define a function `is_leap(year)` that returns `True` if the year is a leap year, and `False` otherwise. In the Gregorian calendar, a year is leap if it is divisible by 4, except for end-of-century years, which must be divisible by 400. Assign the function to `result`.",
    starterCode: "def is_leap(year):\n    # Write your logic here\n    pass\n\nresult = is_leap",
    prelude: "",
    checks: [
      { test: "result(2000) == True and result(2400) == True", msg: "Century years 2000 and 2400 should be leap years" },
      { test: "result(1800) == False and result(1900) == False", msg: "Century years 1800 and 1900 should NOT be leap years" },
      { test: "result(2024) == True and result(2023) == False", msg: "Regular year 2024 is leap, 2023 is not" }
    ],
    hint: "A year is leap if `(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)`.",
    solution: "def is_leap(year):\n    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)\nresult = is_leap",
    difficulty: "medium"
  },
  {
    id: "ch01-runner-up-05",
    chapter: 1,
    topic: "lists",
    title: "Find the Runner-Up Score",
    prompt: "Given a list of scores `scores`, find the runner-up score (the second highest unique score in the list). Assign it to `result`.",
    starterCode: "# scores is a list of integers, e.g. [2, 3, 6, 6, 5]\n# result = ...",
    prelude: "scores = [5, 7, 6, 7, 8, 8, 4, 3]",
    checks: [
      { test: "result == 7", msg: "For scores [5, 7, 6, 7, 8, 8, 4, 3], the runner-up score must be 7" }
    ],
    hint: "Convert the list to a set to remove duplicates, sort it, and select the second to last element.",
    solution: "result = sorted(list(set(scores)))[-2]",
    difficulty: "medium"
  },
  {
    id: "ch01-list-comprehension-06",
    chapter: 1,
    topic: "list comprehension",
    title: "Odd Squares Filter",
    prompt: "Given a list of numbers `nums`, use list comprehension to create a new list `result` containing the squares of all odd numbers in `nums`.",
    starterCode: "# nums is a list of integers, e.g. [1, 2, 3, 4, 5]\n# result = ...",
    prelude: "nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]",
    checks: [
      { test: "isinstance(result, list)", msg: "result must be a list" },
      { test: "result == [1, 9, 25, 49, 81]", msg: "result must contain squares of odd numbers: [1, 9, 25, 49, 81]" }
    ],
    hint: "Use the list comprehension syntax `[expression for item in list if condition]`, filtering with `x % 2 != 0`.",
    solution: "result = [x**2 for x in nums if x % 2 != 0]",
    difficulty: "easy"
  },
  {
    id: "ch01-fizzbuzz-07",
    chapter: 1,
    topic: "loops & logic",
    title: "FizzBuzz Challenge",
    prompt: "Define a function `fizzbuzz(n)` that returns a list of strings representing the numbers from 1 to `n` (inclusive). For multiples of 3, return 'Fizz' instead of the number. For multiples of 5, return 'Buzz'. For multiples of both 3 and 5, return 'FizzBuzz'. Assign the function to `result`.",
    starterCode: "def fizzbuzz(n):\n    # Write logic here\n    pass\n\nresult = fizzbuzz",
    prelude: "",
    checks: [
      { test: "result(15) == ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']", msg: "fizzbuzz(15) output is incorrect" },
      { test: "result(3) == ['1', '2', 'Fizz']", msg: "fizzbuzz(3) should return ['1', '2', 'Fizz']" }
    ],
    hint: "Use a loop or list comprehension. Check for `i % 15 == 0` first, then `i % 3 == 0`, then `i % 5 == 0`, otherwise convert `i` to a string with `str(i)`.",
    solution: "def fizzbuzz(n):\n    res = []\n    for i in range(1, n + 1):\n      if i % 15 == 0:\n        res.append('FizzBuzz')\n      elif i % 3 == 0:\n        res.append('Fizz')\n      elif i % 5 == 0:\n        res.append('Buzz')\n      else:\n        res.append(str(i))\n    return res\nresult = fizzbuzz",
    difficulty: "easy"
  },
  {
    id: "ch01-count-vowels-08",
    chapter: 1,
    topic: "string parsing",
    title: "Count Vowels",
    prompt: "Define a function `count_vowels(s)` that counts and returns the number of vowels (a, e, i, o, u) in a string `s`, ignoring case. Assign the function to `result`.",
    starterCode: "def count_vowels(s):\n    # Count vowels in s\n    pass\n\nresult = count_vowels",
    prelude: "",
    checks: [
      { test: "result('Hello World') == 3", msg: "count_vowels('Hello World') should return 3" },
      { test: "result('Python Programming') == 4", msg: "count_vowels('Python Programming') should return 4" },
      { test: "result('AEIOU aeiou') == 10", msg: "count_vowels('AEIOU aeiou') should return 10" }
    ],
    hint: "Iterate over the string, check if characters are in a set/string of vowels, e.g., 'aeiouAEIOU'.",
    solution: "def count_vowels(s):\n    return sum(1 for char in s if char.lower() in 'aeiou')\nresult = count_vowels",
    difficulty: "easy"
  },
  {
    id: "ch01-dict-merge-09",
    chapter: 1,
    topic: "dictionaries",
    title: "Merge Dictionaries",
    prompt: "Given two dictionaries `dict1` and `dict2`, merge them. If there's a duplicate key, keep the value from `dict2`. Assign the merged dictionary to `result`.",
    starterCode: "# dict1 and dict2 are defined in scope\n# result = ...",
    prelude: "dict1 = {'a': 100, 'b': 200, 'c': 300}\ndict2 = {'b': 99, 'd': 400}",
    checks: [
      { test: "isinstance(result, dict)", msg: "result must be a dictionary" },
      { test: "result == {'a': 100, 'b': 99, 'c': 300, 'd': 400}", msg: "result must contain merged keys with correct values" }
    ],
    hint: "In Python 3.5+, you can use `{**dict1, **dict2}` or use `dict1.copy()` and `.update(dict2)`.",
    solution: "result = {**dict1, **dict2}",
    difficulty: "easy"
  },
  {
    id: "ch01-safe-divide-10",
    chapter: 1,
    topic: "exception handling",
    title: "Safe Division",
    prompt: "Define a function `safe_divide(a, b)` that divides `a` by `b`. If `b` is 0, return `None` instead of throwing a `ZeroDivisionError`. Use a try-except block. Assign the function to `result`.",
    starterCode: "def safe_divide(a, b):\n    # Write try-except logic here\n    pass\n\nresult = safe_divide",
    prelude: "",
    checks: [
      { test: "result(10, 2) == 5.0", msg: "safe_divide(10, 2) should return 5.0" },
      { test: "result(5, 0) is None", msg: "safe_divide(5, 0) should return None without erroring" }
    ],
    hint: "Wrap `return a / b` in a `try` block, and catch `ZeroDivisionError` returning `None` in the `except` block.",
    solution: "def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None\nresult = safe_divide",
    difficulty: "easy"
  },
  {
    id: "ch01-palindrome-11",
    chapter: 1,
    topic: "string parsing",
    title: "Palindrome Checker",
    prompt: "Define a function `is_palindrome(s)` that returns `True` if `s` is a palindrome (ignoring casing and all non-alphanumeric characters like spaces/punctuation), and `False` otherwise. Assign the function to `result`.",
    starterCode: "def is_palindrome(s):\n    # Write logic here\n    pass\n\nresult = is_palindrome",
    prelude: "",
    checks: [
      { test: "result('A man, a plan, a canal: Panama') == True", msg: "A man, a plan, a canal: Panama is a palindrome" },
      { test: "result('race a car') == False", msg: "race a car is NOT a palindrome" },
      { test: "result('No lemon, no melon') == True", msg: "No lemon, no melon is a palindrome" }
    ],
    hint: "Filter the string to keep only alphanumeric characters `c.isalnum()`, convert to lowercase, and check if it equals its reverse `clean_s[::-1]`.",
    solution: "def is_palindrome(s):\n    clean_s = ''.join(c.lower() for c in s if c.isalnum())\n    return clean_s == clean_s[::-1]\nresult = is_palindrome",
    difficulty: "medium"
  },
  {
    id: "ch01-lambda-filter-12",
    chapter: 1,
    topic: "functional programming",
    title: "Filter Strings with Lambda",
    prompt: "Given a list of strings `words`, use `filter()` and a `lambda` expression to keep only strings that start with the letter 'a' (case-insensitive). Convert the filter object back into a list. Assign the list to `result`.",
    starterCode: "# words is defined in scope\n# result = ...",
    prelude: "words = ['Apple', 'banana', 'apricot', 'Cherry', 'avocado', 'grape']",
    checks: [
      { test: "isinstance(result, list)", msg: "result must be a list" },
      { test: "result == ['Apple', 'apricot', 'avocado']", msg: "result must contain only words starting with a or A: ['Apple', 'apricot', 'avocado']" }
    ],
    hint: "Use `list(filter(lambda w: w.lower().startswith('a'), words))`.",
    solution: "result = list(filter(lambda w: w.lower().startswith('a'), words))",
    difficulty: "easy"
  },
  {
    id: "ch01-most-common-13",
    chapter: 1,
    topic: "lists & sets",
    title: "Most Common Element",
    prompt: "Given a list `items`, find the most frequently occurring item in the list. If there is a tie, any of the tied items is acceptable. Assign it to `result`.",
    starterCode: "# items is defined in scope\n# result = ...",
    prelude: "items = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple']",
    checks: [
      { test: "result == 'apple'", msg: "The most common element is 'apple'" }
    ],
    hint: "You can use `max(set(items), key=items.count)` or the `collections.Counter` class.",
    solution: "result = max(set(items), key=items.count)",
    difficulty: "easy"
  },
  {
    id: "ch01-word-counter-14",
    chapter: 1,
    topic: "dictionaries",
    title: "Word Frequency Counter",
    prompt: "Given a string of text `sentence`, count the occurrences of each word (converted to lowercase, splitting by spaces) and store them in a dictionary. Assign it to `result`.",
    starterCode: "# sentence is defined in scope\n# result = ...",
    prelude: "sentence = 'The quick brown fox jumps over the lazy dog'",
    checks: [
      { test: "isinstance(result, dict)", msg: "result must be a dictionary" },
      { test: "result.get('the') == 2", msg: "'the' occurs twice" },
      { test: "result.get('quick') == 1", msg: "'quick' occurs once" }
    ],
    hint: "Convert `sentence.lower().split()` to a list of words, then count them in a dictionary.",
    solution: "words = sentence.lower().split()\nresult = {}\nfor w in words:\n    result[w] = result.get(w, 0) + 1",
    difficulty: "medium"
  },
  {
    id: "ch01-fibonacci-15",
    chapter: 1,
    topic: "functions & recursion",
    title: "Fibonacci Sequence",
    prompt: "Define a function `fibonacci(n)` that returns a list of the first `n` numbers in the Fibonacci sequence (starting with 0, 1). Assign the function to `result`.",
    starterCode: "def fibonacci(n):\n    # Return list of first n Fibonacci numbers\n    pass\n\nresult = fibonacci",
    prelude: "",
    checks: [
      { test: "result(1) == [0]", msg: "first 1 fibonacci number should be [0]" },
      { test: "result(5) == [0, 1, 1, 2, 3]", msg: "first 5 fibonacci numbers should be [0, 1, 1, 2, 3]" },
      { test: "result(10) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]", msg: "first 10 fibonacci numbers should be correct" }
    ],
    hint: "Initialize the sequence with `[0, 1]` if `n > 1` (or handle base cases), and loop from `2` to `n` appending the sum of the last two elements.",
    solution: "def fibonacci(n):\n    if n <= 0: return []\n    if n == 1: return [0]\n    seq = [0, 1]\n    while len(seq) < n:\n        seq.append(seq[-1] + seq[-2])\n    return seq\nresult = fibonacci",
    difficulty: "medium"
  },
  {
    id: "ch01-json-parsing-16",
    chapter: 1,
    topic: "string parsing",
    title: "JSON Key Extraction",
    prompt: "Parse a JSON string `json_data` into a Python dictionary, and extract the value of the key 'user_id'. Assign it to `result`.",
    starterCode: "import json\n# json_data is defined in scope\n# result = ...",
    prelude: "json_data = '{\"user_id\": 9482, \"username\": \"ninja_coder\", \"skills\": [\"python\", \"sql\"]}'",
    checks: [
      { test: "result == 9482", msg: "result must be the integer 9482" }
    ],
    hint: "Use the `json.loads(json_data)` function to parse the string, then access key `'user_id'`.",
    solution: "import json\nd = json.loads(json_data)\nresult = d['user_id']",
    difficulty: "easy"
  },
  {
    id: "ch01-list-flatten-17",
    chapter: 1,
    topic: "lists",
    title: "Flatten a Nested List",
    prompt: "Given a nested list of lists `nested_list`, flatten it into a single flat list. Assign it to `result`.",
    starterCode: "# nested_list is defined in scope\n# result = ...",
    prelude: "nested_list = [[1, 2, 3], [4, 5], [6], [7, 8, 9]]",
    checks: [
      { test: "isinstance(result, list)", msg: "result must be a list" },
      { test: "result == [1, 2, 3, 4, 5, 6, 7, 8, 9]", msg: "result must be a flattened list" }
    ],
    hint: "Use a nested list comprehension: `[item for sublist in nested_list for item in sublist]` or a standard loop.",
    solution: "result = [item for sublist in nested_list for item in sublist]",
    difficulty: "easy"
  },
  {
    id: "ch01-factorial-18",
    chapter: 1,
    topic: "functions",
    title: "Factorial Calculation",
    prompt: "Define a function `factorial(n)` that returns the factorial of a non-negative integer `n`. Assign the function to `result`.",
    starterCode: "def factorial(n):\n    # Return n!\n    pass\n\nresult = factorial",
    prelude: "",
    checks: [
      { test: "result(0) == 1", msg: "0! must equal 1" },
      { test: "result(5) == 120", msg: "5! must equal 120" },
      { test: "result(7) == 5040", msg: "7! must equal 5040" }
    ],
    hint: "Recall that `0! = 1` and `n! = n * (n - 1)!`. You can use a simple recursive function or loop.",
    solution: "def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)\nresult = factorial",
    difficulty: "easy"
  },

  // --- NUMPY (Chapter 2) ---
  {
    id: "ch02-array-creation-01",
    chapter: 2,
    topic: "numpy arrays",
    title: "Create 3x3 Matrix",
    prompt: "Create a 3x3 NumPy matrix named `result` containing the numbers 10 to 18 (inclusive).",
    starterCode: "import numpy as np\n# result = ...",
    prelude: "",
    checks: [
      { test: "isinstance(result, np.ndarray)", msg: "result must be a numpy ndarray" },
      { test: "result.shape == (3, 3)", msg: "result shape must be 3x3" },
      { test: "np.array_equal(result, np.arange(10, 19).reshape(3, 3))", msg: "result elements must be 10 to 18" }
    ],
    hint: "Use `np.arange(10, 19)` to generate the numbers and `.reshape(3, 3)` to change the dimensions.",
    solution: "result = np.arange(10, 19).reshape(3, 3)",
    difficulty: "easy"
  },
  {
    id: "ch02-boolean-masking-02",
    chapter: 2,
    topic: "boolean masking",
    title: "Filter divisible by 3",
    prompt: "Given a NumPy array `arr`, create a new array `result` containing only the elements of `arr` that are divisible by 3.",
    starterCode: "import numpy as np\n# arr is a 1D numpy array\n# result = ...",
    prelude: "import numpy as np\narr = np.array([2, 3, 6, 7, 9, 11, 12, 15, 20])",
    checks: [
      { test: "isinstance(result, np.ndarray)", msg: "result must be a numpy ndarray" },
      { test: "np.array_equal(result, np.array([3, 6, 9, 12, 15]))", msg: "result must filter out elements that are not divisible by 3" }
    ],
    hint: "Index the array with a boolean mask `arr % 3 == 0`.",
    solution: "result = arr[arr % 3 == 0]",
    difficulty: "easy"
  },
  {
    id: "ch02-axis-argmax-03",
    chapter: 2,
    topic: "numpy argmax",
    title: "Argmax along Axis 1",
    prompt: "Given a 2D NumPy array `matrix`, find the column indices of the maximum values along each row (axis 1). Assign this array of indices to `result`.",
    starterCode: "import numpy as np\n# matrix is a 2D numpy array\n# result = ...",
    prelude: "import numpy as np\nmatrix = np.array([[10, 15, 12], [14, 18, 11], [16, 13, 17]])",
    checks: [
      { test: "np.array_equal(result, matrix.argmax(axis=1))", msg: "result must be indices of maximum values along axis 1" }
    ],
    hint: "Use the `argmax` method on the array with the `axis=1` parameter.",
    solution: "result = matrix.argmax(axis=1)",
    difficulty: "medium"
  },

  // --- PANDAS (Chapter 3) ---
  {
    id: "ch03-df-filtering-01",
    chapter: 3,
    topic: "pandas filtering",
    title: "DataFrame Conditional Filter",
    prompt: "Given a DataFrame `df` with columns 'name', 'salary', and 'department', filter the rows to select employees in the 'Engineering' department with a salary greater than 80000. Assign the resulting DataFrame to `result`.",
    starterCode: "import pandas as pd\n# df is already defined\n# result = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({\n  'name': ['Alice', 'Bob', 'Charlie', 'David', 'Emma'],\n  'salary': [75000, 82000, 95000, 60000, 88000],\n  'department': ['Marketing', 'Engineering', 'Engineering', 'HR', 'Engineering']\n})",
    checks: [
      { test: "isinstance(result, pd.DataFrame)", msg: "result must be a pandas DataFrame" },
      { test: "(result['department'] == 'Engineering').all()", msg: "all selected rows must be in 'Engineering' department" },
      { test: "(result['salary'] > 80000).all()", msg: "all selected rows must have salary > 80000" }
    ],
    hint: "Combine multiple boolean conditions using `&` inside `df[...]`. Wrap each condition in parentheses: `(df['department'] == 'Engineering') & (df['salary'] > 80000)`.",
    solution: "result = df[(df['department'] == 'Engineering') & (df['salary'] > 80000)]",
    difficulty: "easy"
  },
  {
    id: "ch03-pandas-groupby-02",
    chapter: 3,
    topic: "pandas groupby",
    title: "Sales Groupby Store",
    prompt: "Given a DataFrame `df` with columns 'store', 'product', and 'sales', group by 'store' and calculate the total sales for each store. Assign the resulting Series (with 'store' as the index) to `result`.",
    starterCode: "import pandas as pd\n# df is already defined\n# result = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({\n  'store': ['A', 'A', 'B', 'B', 'C', 'C'],\n  'product': ['Apple', 'Banana', 'Apple', 'Banana', 'Apple', 'Banana'],\n  'sales': [120, 80, 150, 90, 110, 70]\n})",
    checks: [
      { test: "isinstance(result, pd.Series)", msg: "result must be a pandas Series" },
      { test: "result.index.name == 'store'", msg: "Series index name must be 'store'" },
      { test: "result['A'] == 200 and result['B'] == 240 and result['C'] == 180", msg: "sales sums for store indices A, B, C must be correct" }
    ],
    hint: "Use `groupby('store')['sales'].sum()`.",
    solution: "result = df.groupby('store')['sales'].sum()",
    difficulty: "easy"
  },
  {
    id: "ch03-pandas-merge-03",
    chapter: 3,
    topic: "pandas merge",
    title: "Merge Two DataFrames",
    prompt: "Given two DataFrames, `df_employees` (with columns 'emp_id', 'name') and `df_departments` (with columns 'emp_id', 'dept_name'), perform an inner merge on 'emp_id'. Assign the merged DataFrame to `result`.",
    starterCode: "import pandas as pd\n# df_employees and df_departments are already defined\n# result = ...",
    prelude: "import pandas as pd\ndf_employees = pd.DataFrame({'emp_id': [1, 2, 3, 4], 'name': ['Alice', 'Bob', 'Charlie', 'David']})\ndf_departments = pd.DataFrame({'emp_id': [2, 3, 4, 5], 'dept_name': ['Engineering', 'Marketing', 'Sales', 'HR']})",
    checks: [
      { test: "isinstance(result, pd.DataFrame)", msg: "result must be a pandas DataFrame" },
      { test: "set(result.columns) == {'emp_id', 'name', 'dept_name'}", msg: "result must contain emp_id, name, and dept_name columns" },
      { test: "len(result) == 3", msg: "result must have 3 matching rows" }
    ],
    hint: "Use `pd.merge(df_employees, df_departments, on='emp_id', how='inner')`.",
    solution: "result = pd.merge(df_employees, df_departments, on='emp_id', how='inner')",
    difficulty: "medium"
  },

  // --- DATA VISUALIZATION (Chapters 4 & 5) ---
  {
    id: "ch04-fig-create-01",
    chapter: 4,
    topic: "matplotlib plotting",
    title: "Create Plot Figure",
    prompt: "Create a matplotlib figure and axis. Plot a red line of `y` versus `x`. Assign the axis object to `result`.",
    starterCode: "import matplotlib.pyplot as plt\n# x and y are lists pre-defined in scope\n# result = ...",
    prelude: "import numpy as np\nx = np.linspace(0, 10, 100)\ny = np.sin(x)",
    checks: [
      { test: "import matplotlib.axes as maxes; isinstance(result, maxes.Axes)", msg: "result must be a matplotlib Axes object" },
      { test: "len(result.lines) == 1", msg: "axis must contain exactly 1 plot line" },
      { test: "result.lines[0].get_color() == 'red'", msg: "plot line color must be red" }
    ],
    hint: "Call `fig, ax = plt.subplots()` and use `ax.plot(x, y, color='red')`.",
    solution: "fig, ax = plt.subplots()\nax.plot(x, y, color='red')\nresult = ax",
    difficulty: "easy"
  },
  {
    id: "ch05-sns-heatmap-02",
    chapter: 5,
    topic: "seaborn heatmaps",
    title: "Correlation Heatmap",
    prompt: "Given a DataFrame `df`, compute its correlation matrix and then create a Seaborn heatmap with numerical annotations enabled (`annot=True`). Assign the resulting Axes object to `result`.",
    starterCode: "import seaborn as sns\nimport matplotlib.pyplot as plt\n# df is already defined\n# result = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({\n  'A': [1.0, 1.2, 1.5, 1.8, 2.0],\n  'B': [2.0, 2.5, 2.8, 3.2, 3.5],\n  'C': [5.0, 4.8, 4.2, 3.9, 3.5]\n})",
    checks: [
      { test: "import matplotlib.axes as maxes; isinstance(result, maxes.Axes)", msg: "result must be a matplotlib Axes object" }
    ],
    hint: "Compute correlation matrix using `df.corr()`, then pass it to `sns.heatmap(..., annot=True)`.",
    solution: "corr = df.corr()\nresult = sns.heatmap(corr, annot=True)",
    difficulty: "medium"
  },

  // --- CAPSTONE PROJECT (Chapter 6) ---
  {
    id: "ch06-capstone-topn-01",
    chapter: 6,
    topic: "data analysis",
    title: "Top 3 Revenue Movies",
    prompt: "Given a DataFrame `df` with columns 'title' and 'revenue', find the titles of the top 3 highest-revenue movies. Assign the list of titles to `result`.",
    starterCode: "import pandas as pd\n# df is already defined\n# result = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({\n  'title': ['Movie A', 'Movie B', 'Movie C', 'Movie D', 'Movie E', 'Movie F'],\n  'revenue': [120.5, 80.2, 150.0, 45.3, 110.0, 95.5]\n})",
    checks: [
      { test: "isinstance(result, list)", msg: "result must be a list" },
      { test: "result == ['Movie C', 'Movie A', 'Movie E']", msg: "result must list the top 3 movies ['Movie C', 'Movie A', 'Movie E']" }
    ],
    hint: "Use `df.nlargest(3, 'revenue')['title'].tolist()`.",
    solution: "result = df.nlargest(3, 'revenue')['title'].tolist()",
    difficulty: "easy"
  },

  // --- LINEAR REGRESSION (Chapter 8) ---
  {
    id: "ch08-lr-fit-01",
    chapter: 8,
    topic: "supervised learning",
    title: "Train Linear Regression",
    prompt: "Given features matrix `X` and target vector `y`, fit a scikit-learn `LinearRegression` model and predict the target values for `X`. Assign the prediction array to `result`.",
    starterCode: "from sklearn.linear_model import LinearRegression\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_regression\nX, y = make_regression(n_samples=40, n_features=2, noise=0.1, random_state=42)",
    checks: [
      { test: "import numpy as np; expected = LinearRegression().fit(X, y).predict(X); np.allclose(result, expected)", msg: "predictions must match standard linear regression model output" }
    ],
    hint: "Instantiate `model = LinearRegression()`, call `model.fit(X, y)`, and assign `model.predict(X)` to `result`.",
    solution: "model = LinearRegression()\nmodel.fit(X, y)\nresult = model.predict(X)",
    difficulty: "easy"
  },
  {
    id: "ch08-ridge-reg-02",
    chapter: 8,
    topic: "regularization",
    title: "Ridge Regression Regularization",
    prompt: "Train a Ridge regression model on `X` and `y` with regularization strength `alpha=10.0`. Assign the fitted model object to `result`.",
    starterCode: "from sklearn.linear_model import Ridge\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_regression\nX, y = make_regression(n_samples=40, n_features=2, noise=0.1, random_state=42)",
    checks: [
      { test: "from sklearn.linear_model import Ridge; isinstance(result, Ridge)", msg: "result must be a Ridge model instance" },
      { test: "result.alpha == 10.0", msg: "Ridge regularization strength alpha must be 10.0" }
    ],
    hint: "Instantiate `Ridge(alpha=10.0)`, then call `fit(X, y)` and return the model object itself.",
    solution: "model = Ridge(alpha=10.0)\nmodel.fit(X, y)\nresult = model",
    difficulty: "easy"
  },

  // --- FEATURE ENGINEERING (Chapter 9) ---
  {
    id: "ch09-iqr-outliers-01",
    chapter: 9,
    topic: "feature engineering",
    title: "Outlier Detection with IQR",
    prompt: "Given a pandas Series `s` of numeric values, identify the outlier values using the IQR method (values below Q1 - 1.5 * IQR or above Q3 + 1.5 * IQR). Assign the Series of outlier values to `result`.",
    starterCode: "# s is a pandas Series of numeric values\n# result = ...",
    prelude: "import pandas as pd\ns = pd.Series([10.2, 11.4, 9.8, 10.5, 30.1, 10.0, 9.5, -5.4, 10.7])",
    checks: [
      { test: "isinstance(result, pd.Series)", msg: "result must be a pandas Series" },
      { test: "list(result) == [30.1, -5.4]", msg: "outliers detected must be 30.1 and -5.4" }
    ],
    hint: "Compute `q1 = s.quantile(0.25)`, `q3 = s.quantile(0.75)`, `iqr = q3 - q1`, and filter values using `s < q1 - 1.5*iqr` or `s > q3 + 1.5*iqr`.",
    solution: "q1 = s.quantile(0.25)\nq3 = s.quantile(0.75)\niqr = q3 - q1\nresult = s[(s < q1 - 1.5*iqr) | (s > q3 + 1.5*iqr)]",
    difficulty: "medium"
  },

  // --- MODEL SELECTION & TUNING (Chapter 10) ---
  {
    id: "ch10-grid-search-01",
    chapter: 10,
    topic: "hyperparameter tuning",
    title: "GridSearchCV on Random Forest",
    prompt: "Perform a grid search (`GridSearchCV`) over parameters `n_estimators: [10, 50]` and `max_depth: [3, 5]` for a RandomForestClassifier model `rf` using 3-fold cross validation. Fit on features `X` and labels `y`, and assign the best estimator model to `result`.",
    starterCode: "from sklearn.model_selection import GridSearchCV\n# rf, X, and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_classification\nfrom sklearn.ensemble import RandomForestClassifier\nX, y = make_classification(n_samples=40, n_features=4, n_classes=2, random_state=42)\nrf = RandomForestClassifier(random_state=42)",
    checks: [
      { test: "from sklearn.ensemble import RandomForestClassifier; isinstance(result, RandomForestClassifier)", msg: "result must be a RandomForestClassifier instance" },
      { test: "result.n_estimators in [10, 50] and result.max_depth in [3, 5]", msg: "parameters selected must be in the search grid" }
    ],
    hint: "Use `GridSearchCV(estimator=rf, param_grid={'n_estimators': [10, 50], 'max_depth': [3, 5]}, cv=3)`. Fit it, then assign `.best_estimator_` to `result`.",
    solution: "grid = GridSearchCV(estimator=rf, param_grid={'n_estimators': [10, 50], 'max_depth': [3, 5]}, cv=3)\ngrid.fit(X, y)\nresult = grid.best_estimator_",
    difficulty: "medium"
  },

  // --- CLASSIFICATION MODELS (Chapters 11, 12 & 13) ---
  {
    id: "ch11-logreg-fit-01",
    chapter: 11,
    topic: "classification",
    title: "Logistic Regression Probabilities",
    prompt: "Train a Logistic Regression model on features `X` and binary target `y`. Assign the array of predicted class probabilities for `X` (specifically, the probabilities of class 1) to `result`.",
    starterCode: "from sklearn.linear_model import LogisticRegression\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=50, n_features=3, n_classes=2, random_state=42)",
    checks: [
      { test: "import numpy as np; expected = LogisticRegression().fit(X, y).predict_proba(X)[:, 1]; np.allclose(result, expected)", msg: "result must be the probabilities of class 1" }
    ],
    hint: "Fit the model, then call `.predict_proba(X)` and slice the second column: `[:, 1]`.",
    solution: "model = LogisticRegression()\nmodel.fit(X, y)\nresult = model.predict_proba(X)[:, 1]",
    difficulty: "easy"
  },
  {
    id: "ch12-scaler-02",
    chapter: 12,
    topic: "data preprocessing",
    title: "Standardize Features",
    prompt: "Use scikit-learn `StandardScaler` to scale features matrix `X`. Assign the scaled features matrix to `result`.",
    starterCode: "from sklearn.preprocessing import StandardScaler\n# X is pre-defined\n# result = ...",
    prelude: "import numpy as np\nX = np.array([[1.0, 10.0], [2.0, 15.0], [3.0, 20.0]])",
    checks: [
      { test: "import numpy as np; expected = StandardScaler().fit_transform(X); np.allclose(result, expected)", msg: "result must be scaled using StandardScaler" }
    ],
    hint: "Instantiate `StandardScaler()` and call `fit_transform(X)`.",
    solution: "result = StandardScaler().fit_transform(X)",
    difficulty: "easy"
  },
  {
    id: "ch13-svm-fit-03",
    chapter: 13,
    topic: "support vector machines",
    title: "SVM Classifier",
    prompt: "Train a Support Vector Classifier (SVC) using a radial basis function ('rbf') kernel with `C=1.0`. Assign the fitted model object to `result`.",
    starterCode: "from sklearn.svm import SVC\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=50, n_features=4, n_classes=2, random_state=42)",
    checks: [
      { test: "from sklearn.svm import SVC; isinstance(result, SVC)", msg: "result must be an instance of SVC" },
      { test: "result.kernel == 'rbf' and result.C == 1.0", msg: "SVC must use 'rbf' kernel and C=1.0" },
      { test: "hasattr(result, 'classes_')", msg: "SVM model must be fitted on training data X and y" }
    ],
    hint: "Use `SVC(kernel='rbf', C=1.0)` and call `.fit(X, y)`.",
    solution: "model = SVC(kernel='rbf', C=1.0)\nmodel.fit(X, y)\nresult = model",
    difficulty: "easy"
  },

  // --- TREE BASED MODELS (Chapters 14, 15, 16 & 17) ---
  {
    id: "ch14-dt-fit-01",
    chapter: 14,
    topic: "decision trees",
    title: "Decision Tree Classifier",
    prompt: "Train a DecisionTreeClassifier with `max_depth = 4` on features `X` and labels `y`. Assign the trained model to `result`.",
    starterCode: "from sklearn.tree import DecisionTreeClassifier\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=50, n_features=4, n_classes=2, random_state=42)",
    checks: [
      { test: "from sklearn.tree import DecisionTreeClassifier; isinstance(result, DecisionTreeClassifier)", msg: "result must be an instance of DecisionTreeClassifier" },
      { test: "result.max_depth == 4", msg: "DecisionTree max_depth must be 4" },
      { test: "hasattr(result, 'classes_')", msg: "DecisionTree must be fitted on training data X and y" }
    ],
    hint: "Instantiate `DecisionTreeClassifier(max_depth=4)` and fit it.",
    solution: "model = DecisionTreeClassifier(max_depth=4)\nmodel.fit(X, y)\nresult = model",
    difficulty: "easy"
  },
  {
    id: "ch15-rf-fit-02",
    chapter: 15,
    topic: "ensemble learning",
    title: "Random Forest Classifier",
    prompt: "Train a RandomForestClassifier with `n_estimators = 100` and `max_features = 'sqrt'` on features `X` and labels `y`. Assign the trained model to `result`.",
    starterCode: "from sklearn.ensemble import RandomForestClassifier\n# X and y are pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=50, n_features=4, n_classes=2, random_state=42)",
    checks: [
      { test: "from sklearn.ensemble import RandomForestClassifier; isinstance(result, RandomForestClassifier)", msg: "result must be an instance of RandomForestClassifier" },
      { test: "result.n_estimators == 100 and result.max_features == 'sqrt'", msg: "RandomForest must use 100 estimators and sqrt max_features" },
      { test: "hasattr(result, 'estimators_')", msg: "RandomForest must be fitted on training data X and y" }
    ],
    hint: "Instantiate `RandomForestClassifier(n_estimators=100, max_features='sqrt')` and fit it.",
    solution: "model = RandomForestClassifier(n_estimators=100, max_features='sqrt')\nmodel.fit(X, y)\nresult = model",
    difficulty: "easy"
  },

  // --- NLP & TEXT CLASSIFICATION (Chapter 18) ---
  {
    id: "ch18-tfidf-01",
    chapter: 18,
    topic: "natural language processing",
    title: "TF-IDF Vectorizer",
    prompt: "Convert a list of text documents `corpus` to a TF-IDF feature matrix using `TfidfVectorizer`. Assign the fitted vocabulary dictionary (mapping terms to feature indices) to `result`.",
    starterCode: "from sklearn.feature_extraction.text import TfidfVectorizer\n# corpus is pre-defined in scope\n# result = ...",
    prelude: "corpus = [\n  'this is the first document',\n  'this document is the second document',\n  'and this is the third one',\n  'is this the first document'\n]",
    checks: [
      { test: "isinstance(result, dict)", msg: "result must be a dictionary vocabulary mapping" },
      { test: "'document' in result and 'second' in result", msg: "vocabulary mapping must contain the correct terms" }
    ],
    hint: "Fit the vectorizer on the corpus, and retrieve the `.vocabulary_` attribute.",
    solution: "vectorizer = TfidfVectorizer()\nvectorizer.fit(corpus)\nresult = vectorizer.vocabulary_",
    difficulty: "medium"
  },

  // --- UNSUPERVISED CLUSTERING & DIMENSIONALITY REDUCTION (Chapters 20, 21, 22 & 23) ---
  {
    id: "ch20-kmeans-fit-01",
    chapter: 20,
    topic: "k-means clustering",
    title: "K-Means Cluster Centers",
    prompt: "Fit a KMeans model with 3 clusters on data matrix `X` using `random_state=42`. Assign the coordinates of the cluster centers to `result`.",
    starterCode: "from sklearn.cluster import KMeans\n# X is pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_blobs\nX, _ = make_blobs(n_samples=50, centers=3, n_features=2, random_state=42)",
    checks: [
      { test: "result.shape == (3, 2)", msg: "result must be coordinates of 3 cluster centers in 2D space" }
    ],
    hint: "Instantiate `KMeans(n_clusters=3, random_state=42)`, call `.fit(X)`, and return `.cluster_centers_`.",
    solution: "model = KMeans(n_clusters=3, random_state=42)\nmodel.fit(X)\nresult = model.cluster_centers_",
    difficulty: "easy"
  },
  {
    id: "ch22-dbscan-fit-02",
    chapter: 22,
    topic: "density-based clustering",
    title: "DBSCAN Noise Selection",
    prompt: "Train a DBSCAN model with `eps=0.5` and `min_samples=5` on features `X`. Identify the indices of the points that were flagged as noise (outliers) and assign the list of indices to `result`.",
    starterCode: "from sklearn.cluster import DBSCAN\nimport numpy as np\n# X is pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_blobs\nimport numpy as np\nX, _ = make_blobs(n_samples=50, centers=2, cluster_std=0.8, random_state=42)\n# Add a few outliers\nnp.random.seed(42)\noutliers = np.random.uniform(-10, 10, (5, 2))\nX = np.vstack([X, outliers])",
    checks: [
      { test: "isinstance(result, list)", msg: "result must be a list of indices" },
      { test: "len(result) == 5", msg: "must detect exactly 5 noise points" }
    ],
    hint: "Fit the `DBSCAN` model, retrieve the labels, and find indices where `label == -1`.",
    solution: "model = DBSCAN(eps=0.5, min_samples=5)\nmodel.fit(X)\nimport numpy as np\nresult = np.where(model.labels_ == -1)[0].tolist()",
    difficulty: "medium"
  },
  {
    id: "ch23-pca-fit-03",
    chapter: 23,
    topic: "dimensionality reduction",
    title: "PCA Explained Variance",
    prompt: "Perform Principal Component Analysis (PCA) to project the features matrix `X` into 2 principal components. Assign the explained variance ratio array to `result`.",
    starterCode: "from sklearn.decomposition import PCA\n# X is pre-defined\n# result = ...",
    prelude: "from sklearn.datasets import make_blobs\nX, _ = make_blobs(n_samples=40, centers=2, n_features=5, random_state=42)",
    checks: [
      { test: "result.shape == (2,)", msg: "explained variance ratio must contain 2 values" },
      { test: "import numpy as np; from sklearn.decomposition import PCA; expected = PCA(n_components=2).fit(X).explained_variance_ratio_; np.allclose(result, expected)", msg: "explained variance ratios must match PCA model" }
    ],
    hint: "Instantiate `PCA(n_components=2)`, call `.fit(X)`, and retrieve the `.explained_variance_ratio_` attribute.",
    solution: "model = PCA(n_components=2)\nmodel.fit(X)\nresult = model.explained_variance_ratio_",
    difficulty: "easy"
  },
  {
    id: "ch01-string-format-19",
    chapter: 1,
    topic: "string formatting",
    title: "F-Strings Formatting",
    prompt: "Given variables `name` (string) and `score` (float), use f-string formatting to create a string: '{name} scored {score:.2f}%'. Assign it to `result`.",
    starterCode: "# name and score are pre-defined\nresult = ...",
    prelude: "name = 'Alex'\nscore = 94.756",
    checks: [
      { test: "result == 'Alex scored 94.76%'", msg: "result must format name and score with 2 decimal places" }
    ],
    hint: "Use f'{name} scored {score:.2f}%'.",
    solution: "result = f'{name} scored {score:.2f}%'",
    difficulty: "easy"
  },
  {
    id: "ch01-regex-search-20",
    chapter: 1,
    topic: "regular expressions",
    title: "Regex Email Extractor",
    prompt: "Write a function `extract_email(text)` that uses the `re` module to find and return the first email address in a text string. If none is found, return `None`. Assign the function to `result`.",
    starterCode: "import re\n\ndef extract_email(text):\n    # Return first email or None\n    pass\n\nresult = extract_email",
    prelude: "",
    checks: [
      { test: "result('contact us at support@dojo.com for info') == 'support@dojo.com'", msg: "Should extract 'support@dojo.com'" },
      { test: "result('no email here') is None", msg: "Should return None if no email matches" }
    ],
    hint: "Use re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', text). If match exists, return .group(0), else None.",
    solution: "import re\ndef extract_email(text):\n    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', text)\n    return match.group(0) if match else None\nresult = extract_email",
    difficulty: "medium"
  },
  {
    id: "ch01-pathlib-ops-21",
    chapter: 1,
    topic: "file operations",
    title: "Extract File Extension",
    prompt: "Given a file path string `path_str`, use `pathlib.Path` to extract and return the suffix (extension, e.g. '.json' or '.py') in lowercase. Assign the function to `result`.",
    starterCode: "from pathlib import Path\n\ndef get_extension(path_str):\n    # Write logic here\n    pass\n\nresult = get_extension",
    prelude: "",
    checks: [
      { test: "result('docs/invoice.PDF') == '.pdf'", msg: "Should return '.pdf'" },
      { test: "result('/usr/bin/python') == ''", msg: "Should return empty string for files with no extension" }
    ],
    hint: "Use Path(path_str).suffix.lower().",
    solution: "from pathlib import Path\ndef get_extension(path_str):\n    return Path(path_str).suffix.lower()\nresult = get_extension",
    difficulty: "easy"
  },
  {
    id: "ch01-list-slicing-22",
    chapter: 1,
    topic: "lists",
    title: "List Slicing and Step",
    prompt: "Given a list `numbers`, return a list containing the elements from index 2 up to index 8 (exclusive) in reverse order. Assign the list to `result`.",
    starterCode: "# numbers is pre-defined\nresult = ...",
    prelude: "numbers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]",
    checks: [
      { test: "result == [80, 70, 60, 50, 40, 30]", msg: "Result must be sliced correctly: [80, 70, 60, 50, 40, 30]" }
    ],
    hint: "First slice from index 2 to 8, then reverse using [::-1] or use index step numbers[7:1:-1].",
    solution: "result = numbers[7:1:-1]",
    difficulty: "medium"
  },
  {
    id: "ch01-map-lambda-23",
    chapter: 1,
    topic: "functional programming",
    title: "Map & Lambda Converter",
    prompt: "Given a list of Celsius temperatures `celsius_list`, use `map()` and a `lambda` expression to convert them to Fahrenheit. (Fahrenheit = Celsius * 9/5 + 32). Convert the map object to a list and assign to `result`.",
    starterCode: "# celsius_list is pre-defined\nresult = ...",
    prelude: "celsius_list = [0, 20, 37, 100]",
    checks: [
      { test: "result == [32.0, 68.0, 98.6, 212.0]", msg: "Result must contain correct Fahrenheit temperatures" }
    ],
    hint: "Use list(map(lambda c: c * 9/5 + 32, celsius_list)).",
    solution: "result = list(map(lambda c: c * 9/5 + 32, celsius_list))",
    difficulty: "easy"
  },
  {
    id: "ch01-set-operations-24",
    chapter: 1,
    topic: "sets",
    title: "Symmetric Difference",
    prompt: "Given two sets `set_a` and `set_b`, return a set containing elements that are in either `set_a` or `set_b`, but not in both. Assign to `result`.",
    starterCode: "# set_a and set_b are pre-defined\nresult = ...",
    prelude: "set_a = {1, 2, 3, 4}\nset_b = {3, 4, 5, 6}",
    checks: [
      { test: "result == {1, 2, 5, 6}", msg: "Result must be the symmetric difference {1, 2, 5, 6}" }
    ],
    hint: "Use set_a.symmetric_difference(set_b) or set_a ^ set_b.",
    solution: "result = set_a ^ set_b",
    difficulty: "easy"
  },
  {
    id: "ch01-generators-yield-25",
    chapter: 1,
    topic: "generators",
    title: "Even Number Generator",
    prompt: "Define a generator function `even_generator(limit)` that yields even numbers starting from 0 up to but not including `limit`. Assign the generator function to `result`.",
    starterCode: "def even_generator(limit):\n    # Yield even numbers\n    pass\n\nresult = even_generator",
    prelude: "",
    checks: [
      { test: "list(result(10)) == [0, 2, 4, 6, 8]", msg: "Should yield [0, 2, 4, 6, 8] for limit=10" }
    ],
    hint: "Use a loop, check if i % 2 == 0, and yield i.",
    solution: "def even_generator(limit):\n    for i in range(limit):\n        if i % 2 == 0:\n            yield i\nresult = even_generator",
    difficulty: "medium"
  },
  {
    id: "ch01-decorators-timer-26",
    chapter: 1,
    topic: "decorators",
    title: "Custom Counter Decorator",
    prompt: "Write a decorator function `count_calls(func)` that counts how many times the decorated function is called. The decorator should add a `call_count` attribute to the decorated wrapper, initializing it to 0 and incrementing it on each call before executing the function. Assign the decorator to `result`.",
    starterCode: "def count_calls(func):\n    # Write wrapper logic\n    pass\n\nresult = count_calls",
    prelude: "",
    checks: [
      { test: "@result\ndef dummy(): return 1\ndummy(); dummy()\ndummy.call_count == 2", msg: "The call_count attribute must increment on every function call" }
    ],
    hint: "Define a wrapper. Set wrapper.call_count = 0 on wrapper, increment inside wrapper, call func, and return wrapper.",
    solution: "def count_calls(func):\n    def wrapper(*args, **kwargs):\n        wrapper.call_count += 1\n        return func(*args, **kwargs)\n    wrapper.call_count = 0\n    return wrapper\nresult = count_calls",
    difficulty: "hard"
  },
  {
    id: "ch01-datetime-conv-27",
    chapter: 1,
    topic: "datetime",
    title: "Days Between Dates",
    prompt: "Define a function `days_between(d1_str, d2_str)` that calculates the absolute number of days between two date strings formatted as 'YYYY-MM-DD'. Assign the function to `result`.",
    starterCode: "from datetime import datetime\n\ndef days_between(d1_str, d2_str):\n    # Return absolute difference in days\n    pass\n\nresult = days_between",
    prelude: "",
    checks: [
      { test: "result('2026-06-01', '2026-06-05') == 4", msg: "Difference between 2026-06-01 and 2026-06-05 must be 4 days" },
      { test: "result('2026-06-10', '2026-06-05') == 5", msg: "Should support date subtraction in reverse order (absolute value)" }
    ],
    hint: "Parse strings with datetime.strptime(date_str, '%Y-%m-%d'), subtract, and return abs(delta.days).",
    solution: "from datetime import datetime\ndef days_between(d1_str, d2_str):\n    d1 = datetime.strptime(d1_str, '%Y-%m-%d')\n    d2 = datetime.strptime(d2_str, '%Y-%m-%d')\n    return abs((d2 - d1).days)\nresult = days_between",
    difficulty: "medium"
  },
  {
    id: "ch01-math-calculations-28",
    chapter: 1,
    topic: "math operations",
    title: "Circle Area and Circumference",
    prompt: "Given the radius `r`, compute the area and circumference of a circle. Use `math.pi`. Return a tuple `(area, circumference)` rounded to 3 decimal places. Assign the function to `result`.",
    starterCode: "import math\n\ndef circle_stats(r):\n    # Return (area, circumference) rounded to 3 dec places\n    pass\n\nresult = circle_stats",
    prelude: "",
    checks: [
      { test: "result(5) == (78.54, 31.416)", msg: "circle_stats(5) must match expected results rounded to 3 decimal places" }
    ],
    hint: "Area is pi * r^2 and circumference is 2 * pi * r. Round using round(val, 3).",
    solution: "import math\ndef circle_stats(r):\n    area = math.pi * (r ** 2)\n    circ = 2 * math.pi * r\n    return (round(area, 3), round(circ, 3))\nresult = circle_stats",
    difficulty: "easy"
  },
  {
    id: "ch02-numpy-broadcast-04",
    chapter: 2,
    topic: "numpy essentials",
    title: "Broadcasting Array Shift",
    prompt: "Given a 2D NumPy array `arr` and a 1D array `row_shift`, subtract `row_shift` from each row of `arr` using broadcasting. Assign the resulting array to `result`.",
    starterCode: "# arr and row_shift are pre-defined\nresult = ...",
    prelude: "import numpy as np\narr = np.array([[10, 20, 30], [40, 50, 60]])\nrow_shift = np.array([1, 2, 3])",
    checks: [
      { test: "import numpy as np; expected = np.array([[9, 18, 27], [39, 48, 57]]); np.allclose(result, expected)", msg: "Result must correctly subtract row_shift from every row of arr" }
    ],
    hint: "Execute arr - row_shift.",
    solution: "result = arr - row_shift",
    difficulty: "easy"
  },
  {
    id: "ch02-numpy-reshape-05",
    chapter: 2,
    topic: "numpy essentials",
    title: "Reshape and Flatten",
    prompt: "Given a 1D NumPy array `flat_arr` of size 12, reshape it to a 2D array of shape (3, 4), and then transpose it to get shape (4, 3). Assign the final transposed array to `result`.",
    starterCode: "# flat_arr is pre-defined\nresult = ...",
    prelude: "import numpy as np\nflat_arr = np.arange(12)",
    checks: [
      { test: "result.shape == (4, 3)", msg: "Result must have shape (4, 3)" },
      { test: "import numpy as np; expected = np.arange(12).reshape(3, 4).T; np.allclose(result, expected)", msg: "Result values must match reshaped and transposed values" }
    ],
    hint: "Use flat_arr.reshape(3, 4).T.",
    solution: "result = flat_arr.reshape(3, 4).T",
    difficulty: "easy"
  },
  {
    id: "ch03-pandas-loc-iloc-04",
    chapter: 3,
    topic: "pandas analytics",
    title: "Indexing with loc and iloc",
    prompt: "Given a Pandas DataFrame `df` with row index labels 'a', 'b', 'c', select the value in column 'Price' for row label 'b' using `.loc`, and the value in the first row, second column using `.iloc`. Assign the tuple `(loc_val, iloc_val)` to `result`.",
    starterCode: "# df is pre-defined\nresult = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({'Item': ['Apple', 'Banana', 'Cherry'], 'Price': [0.5, 0.3, 0.8]}, index=['a', 'b', 'c'])",
    checks: [
      { test: "isinstance(result, tuple)", msg: "result must be a tuple" },
      { test: "result == (0.3, 0.5)", msg: "result must be (0.3, 0.5)" }
    ],
    hint: "Use df.loc['b', 'Price'] and df.iloc[0, 1].",
    solution: "result = (df.loc['b', 'Price'], df.iloc[0, 1])",
    difficulty: "medium"
  },
  {
    id: "ch03-pandas-apply-05",
    chapter: 3,
    topic: "pandas analytics",
    title: "Apply Custom Logic",
    prompt: "Given a Pandas DataFrame `df` representing employee salaries, write a function or lambda expression with `.apply()` to double any salary below 50,000, leaving others unchanged. Assign the updated 'Salary' column to `result`.",
    starterCode: "# df is pre-defined\nresult = ...",
    prelude: "import pandas as pd\ndf = pd.DataFrame({'Name': ['Alice', 'Bob', 'Charlie'], 'Salary': [45000, 60000, 30000]})",
    checks: [
      { test: "list(result) == [90000, 60000, 60000]", msg: "Salaries below 50,000 should be doubled" }
    ],
    hint: "Use df['Salary'].apply(lambda x: x * 2 if x < 50000 else x).",
    solution: "result = df['Salary'].apply(lambda x: x * 2 if x < 50000 else x)",
    difficulty: "medium"
  },
  {
    id: "ch03-pandas-nans-06",
    chapter: 3,
    topic: "pandas analytics",
    title: "Missing Value Imputation",
    prompt: "Given a Pandas DataFrame `df` containing missing values (`NaN`), fill all missing values in the 'Age' column with the median age of that column. Assign the modified DataFrame to `result`.",
    starterCode: "# df is pre-defined\nresult = ...",
    prelude: "import pandas as pd; import numpy as np\ndf = pd.DataFrame({'Name': ['Joe', 'Jill', 'Jack', 'Jan'], 'Age': [25.0, np.nan, 35.0, np.nan]})",
    checks: [
      { test: "result['Age'].isnull().sum() == 0", msg: "No missing values should remain in 'Age' column" },
      { test: "list(result['Age']) == [25.0, 30.0, 35.0, 30.0]", msg: "NaN values must be replaced by column median (30.0)" }
    ],
    hint: "Calculate median with df['Age'].median(), then fillna.",
    solution: "df_copy = df.copy()\ndf_copy['Age'] = df_copy['Age'].fillna(df_copy['Age'].median())\nresult = df_copy",
    difficulty: "medium"
  },
  {
    id: "ch08-lasso-reg-03",
    chapter: 8,
    topic: "regression models",
    title: "Lasso L1 Regularization",
    prompt: "Train a `Lasso` regression model with regularizer coefficient `alpha = 0.5` on features `X` and targets `y`. Assign the fitted model to `result`.",
    starterCode: "from sklearn.linear_model import Lasso\n# X and y are pre-defined\nresult = ...",
    prelude: "from sklearn.datasets import make_regression\nX, y = make_regression(n_samples=40, n_features=3, random_state=42)",
    checks: [
      { test: "from sklearn.linear_model import Lasso; isinstance(result, Lasso)", msg: "result must be an instance of Lasso" },
      { test: "result.alpha == 0.5", msg: "Lasso alpha parameter must be 0.5" },
      { test: "hasattr(result, 'coef_')", msg: "Lasso model must be fitted on training data X and y" }
    ],
    hint: "Use Lasso(alpha=0.5) and fit it.",
    solution: "model = Lasso(alpha=0.5)\nmodel.fit(X, y)\nresult = model",
    difficulty: "easy"
  },
  {
    id: "ch10-train-test-split-02",
    chapter: 10,
    topic: "model evaluation",
    title: "Train Test Split",
    prompt: "Use scikit-learn `train_test_split` to split dataset features `X` and labels `y` into training and validation sets. Use a test size of 30% (`test_size=0.3`) and set `random_state=42`. Assign the resulting tuple `(X_train, X_test, y_train, y_test)` to `result`.",
    starterCode: "from sklearn.model_selection import train_test_split\n# X and y are pre-defined\nresult = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=60, n_features=4, random_state=42)",
    checks: [
      { test: "isinstance(result, tuple) and len(result) == 4", msg: "result must be a tuple of 4 elements" },
      { test: "result[0].shape == (42, 4) and result[1].shape == (18, 4)", msg: "X_train should have 42 samples and X_test should have 18 samples" }
    ],
    hint: "Use train_test_split(X, y, test_size=0.3, random_state=42).",
    solution: "result = train_test_split(X, y, test_size=0.3, random_state=42)",
    difficulty: "easy"
  },
  {
    id: "ch10-confusion-matrix-03",
    chapter: 10,
    topic: "model evaluation",
    title: "Model Accuracy & Matrix",
    prompt: "Given true labels `y_true` and predicted labels `y_pred`, calculate the confusion matrix and the overall accuracy score. Assign the tuple `(conf_matrix, accuracy)` to `result`.",
    starterCode: "from sklearn.metrics import confusion_matrix, accuracy_score\n# y_true and y_pred are pre-defined\nresult = ...",
    prelude: "y_true = [0, 1, 1, 0, 1, 0, 0, 1]\ny_pred = [0, 1, 0, 0, 1, 0, 1, 1]",
    checks: [
      { test: "isinstance(result, tuple) and len(result) == 2", msg: "result must be a tuple of 2 items" },
      { test: "result[1] == 0.75", msg: "Accuracy should be 6 out of 8 (0.75)" },
      { test: "result[0][0,0] == 3 and result[0][1,1] == 3", msg: "Confusion matrix values are incorrect" }
    ],
    hint: "Call confusion_matrix(y_true, y_pred) and accuracy_score(y_true, y_pred).",
    solution: "result = (confusion_matrix(y_true, y_pred), accuracy_score(y_true, y_pred))",
    difficulty: "easy"
  },
  {
    id: "ch15-gradient-boosting-03",
    chapter: 15,
    topic: "ensemble learning",
    title: "Gradient Boosting Classifier",
    prompt: "Train a `GradientBoostingClassifier` with `learning_rate=0.1` and `n_estimators=50` on features `X` and labels `y`. Assign the fitted model to `result`.",
    starterCode: "from sklearn.ensemble import GradientBoostingClassifier\n# X and y are pre-defined\nresult = ...",
    prelude: "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=50, n_features=4, random_state=42)",
    checks: [
      { test: "from sklearn.ensemble import GradientBoostingClassifier; isinstance(result, GradientBoostingClassifier)", msg: "result must be a GradientBoostingClassifier" },
      { test: "result.n_estimators == 50 and result.learning_rate == 0.1", msg: "GradientBoosting model parameters do not match" },
      { test: "hasattr(result, 'estimators_')", msg: "GradientBoosting model must be fitted on training data X and y" }
    ],
    hint: "Use GradientBoostingClassifier(n_estimators=50, learning_rate=0.1) and fit.",
    solution: "model = GradientBoostingClassifier(n_estimators=50, learning_rate=0.1)\nmodel.fit(X, y)\nresult = model",
    difficulty: "medium"
  },
  {
    id: "ch18-count-vectorizer-02",
    chapter: 18,
    topic: "natural language processing",
    title: "Bag of Words Text Vectorizer",
    prompt: "Convert the `corpus` documents list to a matrix of token counts using `CountVectorizer` with English stop words. Fit the vectorizer on the corpus, and retrieve the shape of the resulting transform matrix. Assign the shape tuple to `result`.",
    starterCode: "from sklearn.feature_extraction.text import CountVectorizer\n# corpus is pre-defined\nresult = ...",
    prelude: "corpus = ['The quick brown fox jumps over the lazy dog.', 'Never jump over the lazy dog.']",
    checks: [
      { test: "isinstance(result, tuple) and len(result) == 2", msg: "result must be a shape tuple" },
      { test: "result == (2, 6)", msg: "Result shape must be (2, 6) after removing stop words" }
    ],
    hint: "Use CountVectorizer(stop_words='english'). Fit-transform and call .shape.",
    solution: "vec = CountVectorizer(stop_words='english')\nmat = vec.fit_transform(corpus)\nresult = mat.shape",
    difficulty: "medium"
  }
];
