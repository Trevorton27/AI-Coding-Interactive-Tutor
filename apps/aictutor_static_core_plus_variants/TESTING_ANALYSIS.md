# Testing System Analysis

## How Challenges Are Being Tested

### Testing Architecture

**Location:** [apps/web/app/api/eval/route.ts](apps/web/app/api/eval/route.ts)

The testing system uses a **virtual DOM approach** with JSDOM to run tests in a sandboxed environment:

### Test Flow

```
Student Code (HTML/CSS/JS)
    ↓
buildHTMLDocument() - Combines files into single HTML
    ↓
JSDOM - Creates virtual browser environment
    ↓
Test Execution - Runs test code with document/window context
    ↓
Results - Returns pass/fail for each test
```

### Detailed Process

#### 1. **File Combination** (lines 84-125)
```javascript
function buildHTMLDocument(files: Record<string, string>): string
```

- Takes student's `index.html`, `style.css`, and `script.js`
- Injects CSS into `<head>` as `<style>` tags
- Injects JS into `<body>` as `<script>` tags
- Strips basic TypeScript syntax (type annotations, interfaces)
- Returns complete HTML document

**Example:**
```javascript
Input: {
  "index.html": "<!DOCTYPE html><html><body>...</body></html>",
  "style.css": "body { color: red; }",
  "script.js": "console.log('hello');"
}

Output:
<!DOCTYPE html>
<html>
<head>
  <style>
  body { color: red; }
  </style>
</head>
<body>
  ...
  <script>
  console.log('hello');
  </script>
</body>
</html>
```

#### 2. **Virtual DOM Creation** (lines 20-26)
```javascript
const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  resources: "usable"
});
```

- Creates a virtual browser environment
- `runScripts: "dangerously"` - Executes student's JavaScript
- `resources: "usable"` - Allows resource loading
- Provides `window` and `document` objects

#### 3. **Test Execution** (lines 40-62)
```javascript
for (const test of task.tests || []) {
  const testFn = new Function("document", "window", `return ${test.code}`);
  const result = testFn(document, window);
  // ...
}
```

**For each test:**
- Creates a JavaScript function from test code string
- Passes virtual `document` and `window` as arguments
- Executes the function
- Checks if result is truthy (test passed) or falsy (test failed)

**Example Test:**
```json
{
  "id": "h1",
  "code": "!!document.querySelector('h1')",
  "label": "Has <h1> heading"
}
```

Becomes:
```javascript
function(document, window) {
  return !!document.querySelector('h1');
}
```

If an `<h1>` exists in the virtual DOM, returns `true` (pass).

#### 4. **Result Collection** (lines 32-62)
```javascript
results = {
  passed: boolean,        // Overall pass/fail
  passedIds: string[],    // IDs of passed tests
  failedIds: string[],    // IDs of failed tests
  messages: {},           // Messages per test
  testLabels: {}          // Human-readable labels
}
```

### Test Types

Based on analyzing the test patterns in `tasks.levels.json`:

#### **DOM Query Tests** (Most Common)
```javascript
// Check element exists
"!!document.querySelector('h1')"
"!!document.querySelector('p')"
"!!document.querySelector('ul')"

// Check element count
"document.querySelectorAll('ul li').length>=3"

// Check attributes
"!!document.querySelector('img[alt]')"
"document.querySelector('a[href=\"https://example.com\"]').target==='_blank'"
```

#### **Style Tests** (CSS Validation)
```javascript
// Would use getComputedStyle
"getComputedStyle(document.querySelector('h1')).color === 'rgb(0, 0, 255)'"
```

#### **Placeholder Tests** (Not Yet Implemented)
```javascript
// Generic placeholder
"document!=null"
```

### Limitations

1. **No React Testing Yet** - React tests use placeholder `document!=null`
2. **Simple TypeScript Stripping** - Only removes basic syntax
3. **100ms Script Delay** - May not be enough for complex async code
4. **No Error Details** - Just pass/fail, not why it failed
5. **CSS Injection** - Doesn't perfectly mimic `<link>` tags
6. **No Module System** - Can't test ES6 imports/exports properly

---

## How Solutions Are Being Devised

### Solution Generation Strategy

**Location:** [scripts/generate-solutions.py](scripts/generate-solutions.py)

The solution generator uses **test code analysis** to reverse-engineer what the student needs to build:

### Generation Flow

```
Task Tests (test.code)
    ↓
Analyze Test Code - Pattern matching
    ↓
Identify Requirements - What elements/features needed
    ↓
Generate Code - HTML/CSS/JS that satisfies tests
    ↓
Save to task.solution
```

### Pattern Matching Examples

#### HTML Generation
```python
def generate_html_solution(task_id, tests):
    # Scan all test codes
    needs_h1 = any('h1' in test.get('code', '') for test in tests)
    needs_p = any("querySelector('p')" in test.get('code', '') for test in tests)
    needs_ul = any("querySelector('ul')" in test.get('code', '') for test in tests)
    # ...
```

**Test Pattern → Generated Code:**
```
Test: "!!document.querySelector('h1')"
→ Generated: <h1>Welcome to My Page</h1>

Test: "!!document.querySelector('p')"
→ Generated: <p>This is a paragraph with some text content.</p>

Test: "querySelectorAll('ul li').length>=3"
→ Generated: <ul>
              <li>List item 1</li>
              <li>List item 2</li>
              <li>List item 3</li>
            </ul>
```

#### Attribute Handling
```
Test: 'querySelector(\'a[href="https://example.com"]\')'
→ Generated: <a href="https://example.com">Visit Example</a>

Test: ".target==='_blank'"
→ Generated: <a href="https://example.com" target="_blank">Visit Example</a>

Test: 'querySelector(\'img[alt]\')'
→ Generated: <img src="image.jpg" alt="Description of the image">
```

#### CSS Generation
```python
if 'color' in code_str or 'Color' in code_str:
    css_rules.append('h1 { color: #2563eb; }')

if 'backgroundColor' in code_str:
    css_rules.append('.container { background-color: #f3f4f6; }')
```

#### JavaScript Generation
```python
if 'addEventListener' in code_str or 'click' in code_str:
    js_code.append('''
    document.addEventListener('DOMContentLoaded', function() {
      const button = document.querySelector('button');
      button.addEventListener('click', function() {
        alert('Button clicked!');
      });
    });
    ''')
```

### Solution Quality

**Strengths:**
- ✅ Guaranteed to pass tests (generated from test requirements)
- ✅ Functional and working code
- ✅ Covers all 120 tasks
- ✅ Follows basic HTML/CSS/JS patterns

**Weaknesses:**
- ⚠️ Generic content ("Welcome to My Page", "List item 1")
- ⚠️ Not always pedagogically optimal
- ⚠️ May not demonstrate best practices
- ⚠️ React solutions are placeholder code
- ⚠️ No real API calls for async tasks
- ⚠️ Algorithm solutions not implemented yet

---

## Test Coverage Analysis

### By Category

| Category | Tasks | Test Type | Solution Quality |
|----------|-------|-----------|------------------|
| HTML Basics | 15 | DOM queries | ✅ Excellent |
| CSS & Layout | 15 | Placeholder (`document!=null`) | ⚠️ Basic |
| JS DOM | 15 | Placeholder | ⚠️ Basic |
| Algorithms | 15 | Placeholder | ⚠️ Basic |
| Async & Modules | 15 | Placeholder | ⚠️ Basic |
| React Basics | 15 | Placeholder | ⚠️ Basic |
| React Hooks | 15 | Placeholder | ⚠️ Basic |
| React Capstone | 15 | Placeholder | ⚠️ Basic |

### Test Patterns Used

```javascript
// Level 1: HTML Basics (REAL TESTS)
"!!document.querySelector('h1')"                          // 15 tasks
"!!document.querySelector('p')"                           // 15 tasks
"querySelectorAll('ul li').length>=3"                     // 5 tasks
'querySelector(\'a[href="https://example.com"]\')'        // 5 tasks
".target==='_blank'"                                      // 5 tasks
"querySelector('img[alt]')"                               // 5 tasks
"querySelector('table')"                                  // 5 tasks

// Level 2-8: All Categories (PLACEHOLDER)
"document!=null"                                          // 105 tasks
```

**Total Real Tests:** 15 tasks (HTML Basics only)
**Total Placeholder Tests:** 105 tasks (all other categories)

---

## Recommendations for Improvement

### 1. Implement Real Tests for All Categories

**CSS & Layout:**
```javascript
{
  "id": "css-color",
  "code": "getComputedStyle(document.querySelector('h1')).color === 'rgb(37, 99, 235)'"
}
```

**JS DOM:**
```javascript
{
  "id": "event-listener",
  "code": "typeof document.querySelector('button').onclick === 'function'"
}
```

**Algorithms:**
```javascript
{
  "id": "array-sort",
  "code": "typeof sortArray === 'function' && sortArray([3,1,2]).join(',') === '1,2,3'"
}
```

### 2. Enhanced Solution Generator

- Use AI/LLM to generate better solutions
- Add comments explaining code
- Include multiple approaches
- Add accessibility features
- Use semantic HTML

### 3. Test Validation System

Create automated validation to ensure:
- All solutions pass their tests
- All tests are actually meaningful
- No false positives/negatives

### 4. Test Coverage Metrics

Track:
- How many tests per task
- What % are real vs placeholder
- Test execution time
- Pass/fail rates

---

## Next Steps

1. **Create test validation script** - Verify all 120 solutions pass
2. **Generate test coverage report** - Show which tests are real
3. **Implement real tests** - Replace placeholders with actual checks
4. **Improve solutions** - Better code quality and explanations
5. **Add test documentation** - Explain what each test validates
