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
    check: "assert result == 'Hello, World!'",
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
    check: "assert result == (a + b, a - b, a * b)",
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
    check: "assert result == (a // b, a / b)",
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
    check: "assert result(2000) == True\nassert result(2400) == True\nassert result(1800) == False\nassert result(1900) == False\nassert result(2024) == True\nassert result(2023) == False",
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
    check: "unique_scores = list(set(scores))\nunique_scores.sort()\nassert result == unique_scores[-2] if len(unique_scores) >= 2 else None",
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
    check: "assert result == [x**2 for x in nums if x % 2 != 0]",
    hint: "Use the list comprehension syntax `[expression for item in list if condition]`, filtering with `x % 2 != 0`.",
    solution: "result = [x**2 for x in nums if x % 2 != 0]",
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
    check: "import numpy as np\nassert isinstance(result, np.ndarray)\nassert result.shape == (3, 3)\nassert np.array_equal(result, np.arange(10, 19).reshape(3, 3))",
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
    check: "import numpy as np\nassert np.array_equal(result, arr[arr % 3 == 0])",
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
    check: "import numpy as np\nassert np.array_equal(result, matrix.argmax(axis=1))",
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
    check: "import pandas as pd\nassert isinstance(result, pd.DataFrame)\nassert (result['department'] == 'Engineering').all()\nassert (result['salary'] > 80000).all()",
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
    check: "import pandas as pd\nassert isinstance(result, pd.Series)\nassert result.index.name == 'store'\nassert (result == df.groupby('store')['sales'].sum()).all()",
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
    check: "import pandas as pd\nassert isinstance(result, pd.DataFrame)\nassert set(result.columns) == {'emp_id', 'name', 'dept_name'}\nassert len(result) == len(pd.merge(df_employees, df_departments, on='emp_id', how='inner'))",
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
    check: "import matplotlib.axes as maxes\nassert isinstance(result, maxes.Axes)\nassert len(result.lines) == 1\nassert result.lines[0].get_color() == 'red'",
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
    check: "import matplotlib.axes as maxes\nassert isinstance(result, maxes.Axes)",
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
    check: "assert isinstance(result, list)\nassert len(result) == 3\nassert result == df.nlargest(3, 'revenue')['title'].tolist()",
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
    check: "import numpy as np\nfrom sklearn.linear_model import LinearRegression\nexpected = LinearRegression().fit(X, y).predict(X)\nassert np.allclose(result, expected)",
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
    check: "from sklearn.linear_model import Ridge\nassert isinstance(result, Ridge)\nassert result.alpha == 10.0",
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
    check: "import pandas as pd\nq1 = s.quantile(0.25)\nq3 = s.quantile(0.75)\niqr = q3 - q1\nexpected = s[(s < (q1 - 1.5*iqr)) | (s > (q3 + 1.5*iqr))]\nassert isinstance(result, pd.Series)\nassert (result == expected).all()",
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
    check: "from sklearn.ensemble import RandomForestClassifier\nassert isinstance(result, RandomForestClassifier)\nassert result.n_estimators in [10, 50]\nassert result.max_depth in [3, 5]",
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
    check: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nexpected = LogisticRegression().fit(X, y).predict_proba(X)[:, 1]\nassert np.allclose(result, expected)",
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
    check: "import numpy as np\nfrom sklearn.preprocessing import StandardScaler\nexpected = StandardScaler().fit_transform(X)\nassert np.allclose(result, expected)",
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
    check: "from sklearn.svm import SVC\nassert isinstance(result, SVC)\nassert result.kernel == 'rbf'\nassert result.C == 1.0",
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
    check: "from sklearn.tree import DecisionTreeClassifier\nassert isinstance(result, DecisionTreeClassifier)\nassert result.max_depth == 4",
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
    check: "from sklearn.ensemble import RandomForestClassifier\nassert isinstance(result, RandomForestClassifier)\nassert result.n_estimators == 100\nassert result.max_features == 'sqrt'",
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
    check: "from sklearn.feature_extraction.text import TfidfVectorizer\nexpected = TfidfVectorizer().fit(corpus).vocabulary_\nassert result == expected",
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
    check: "import numpy as np\nfrom sklearn.cluster import KMeans\nexpected = KMeans(n_clusters=3, random_state=42).fit(X).cluster_centers_\nassert np.allclose(result, expected)",
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
    check: "import numpy as np\nfrom sklearn.cluster import DBSCAN\nexpected_labels = DBSCAN(eps=0.5, min_samples=5).fit(X).labels_\nexpected_indices = np.where(expected_labels == -1)[0].tolist()\nassert result == expected_indices",
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
    check: "import numpy as np\nfrom sklearn.decomposition import PCA\nexpected = PCA(n_components=2).fit(X).explained_variance_ratio_\nassert np.allclose(result, expected)",
    hint: "Instantiate `PCA(n_components=2)`, call `.fit(X)`, and retrieve the `.explained_variance_ratio_` attribute.",
    solution: "model = PCA(n_components=2)\nmodel.fit(X)\nresult = model.explained_variance_ratio_",
    difficulty: "easy"
  }
];
