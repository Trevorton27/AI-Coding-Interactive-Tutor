#!/usr/bin/env python3
"""
Generate meaningful task descriptions based on test requirements
"""
import json
import re
from pathlib import Path

def analyze_test_code(test_code, test_id):
    """Analyze test code and return a human-readable requirement"""

    # HTML Elements
    if "querySelector('h1')" in test_code:
        return "Add an `<h1>` heading"
    if "querySelector('h2')" in test_code:
        return "Add an `<h2>` subheading"
    if "querySelector('p')" in test_code:
        return "Add a `<p>` paragraph"
    if "querySelector('ul')" in test_code:
        return "Create an unordered list (`<ul>`)"
    if "querySelector('ol')" in test_code:
        return "Create an ordered list (`<ol>`)"
    if "querySelectorAll('ul li').length>=3" in test_code:
        return "Include at least 3 list items"
    if 'querySelector(\'a[href="https://example.com"]\')' in test_code:
        return "Add a link to https://example.com"
    if ".target==='_blank'" in test_code:
        return "Make the link open in a new tab (target='_blank')"
    if "querySelector('img[alt]')" in test_code:
        return "Add an image with alt text"
    if "querySelector('table')" in test_code:
        return "Create a table element"
    if "querySelector('form')" in test_code:
        return "Create a form"
    if "querySelector('input" in test_code:
        if 'type="text"' in test_code:
            return "Add a text input field"
        elif 'type="email"' in test_code:
            return "Add an email input field"
        elif 'type="password"' in test_code:
            return "Add a password input field"
        return "Add an input element"
    if "querySelector('button')" in test_code:
        return "Add a button"
    if "querySelector('div')" in test_code:
        return "Add a div container"
    if "querySelector('span')" in test_code:
        return "Add a span element"
    if "querySelector('nav')" in test_code:
        return "Create a navigation element"
    if "querySelector('header')" in test_code:
        return "Add a header element"
    if "querySelector('footer')" in test_code:
        return "Add a footer element"
    if "querySelector('section')" in test_code:
        return "Add a section element"
    if "querySelector('article')" in test_code:
        return "Add an article element"

    # CSS checks
    if "getComputedStyle" in test_code:
        if "color" in test_code or "Color" in test_code:
            return "Style the text color using CSS"
        if "backgroundColor" in test_code:
            return "Set a background color"
        if "fontSize" in test_code:
            return "Set the font size"
        if "display" in test_code and "flex" in test_code:
            return "Use flexbox layout (display: flex)"
        if "display" in test_code and "grid" in test_code:
            return "Use CSS Grid layout"
        if "padding" in test_code:
            return "Add padding to elements"
        if "margin" in test_code:
            return "Add margins to elements"
        if "border" in test_code:
            return "Add borders to elements"

    # JavaScript/DOM
    if "addEventListener" in test_code or "onclick" in test_code:
        return "Add event listeners for user interactions"
    if "innerHTML" in test_code:
        return "Dynamically update content with JavaScript"
    if "classList" in test_code:
        return "Manipulate CSS classes with JavaScript"
    if "textContent" in test_code:
        return "Update text content dynamically"

    # React
    if "useState" in test_code:
        return "Use the useState hook"
    if "useEffect" in test_code:
        return "Use the useEffect hook"
    if "useContext" in test_code:
        return "Use the useContext hook"
    if "useReducer" in test_code:
        return "Use the useReducer hook"
    if "props" in test_code:
        return "Pass props to components"

    # Async/Promises
    if "async" in test_code or "await" in test_code:
        return "Use async/await for asynchronous operations"
    if "Promise" in test_code:
        return "Work with Promises"
    if "fetch" in test_code:
        return "Make API calls using fetch"

    # Algorithms
    if "sort" in test_code:
        return "Implement a sorting algorithm"
    if "filter" in test_code:
        return "Filter array elements"
    if "map" in test_code:
        return "Transform array data with map"
    if "reduce" in test_code:
        return "Use reduce for data aggregation"

    # Fallback
    return f"Complete the '{test_id}' requirement"

def generate_task_description(task):
    """Generate a complete, meaningful description for a task"""
    category = task['category']
    tests = task['tests']
    task_id = task['id']

    # Analyze all tests
    requirements = [analyze_test_code(test['code'], test['id']) for test in tests]

    # Remove duplicates while preserving order
    seen = set()
    unique_reqs = []
    for req in requirements:
        if req not in seen:
            seen.add(req)
            unique_reqs.append(req)

    # Generate description based on category
    if category == "HTML Basics":
        if len(unique_reqs) == 1:
            return f"{unique_reqs[0]} to your HTML page."
        elif len(unique_reqs) == 2:
            return f"{unique_reqs[0]} and {unique_reqs[1].lower()} to your HTML page."
        else:
            req_list = ", ".join(unique_reqs[:-1]) + f", and {unique_reqs[-1].lower()}"
            return f"Create an HTML page with the following elements: {req_list}."

    elif category == "CSS & Layout":
        intro = "Style your HTML page using CSS. "
        if len(unique_reqs) == 1:
            return intro + unique_reqs[0] + "."
        return intro + " ".join(unique_reqs) + "."

    elif category == "JS DOM":
        intro = "Use JavaScript to manipulate the DOM. "
        if len(unique_reqs) == 1:
            return intro + unique_reqs[0] + "."
        return intro + " ".join(unique_reqs) + "."

    elif category == "Algorithms":
        return f"Implement a solution that meets these requirements: {', '.join(unique_reqs)}."

    elif category == "Async & Modules":
        return f"Work with asynchronous JavaScript. {' '.join(unique_reqs)}."

    elif category in ["React Basics", "React Hooks"]:
        return f"Build a React component. {' '.join(unique_reqs)}."

    elif category == "React Capstone":
        return f"Complete this capstone project by implementing: {', '.join(unique_reqs)}."

    else:
        return f"Complete the following requirements: {', '.join(unique_reqs)}."

def main():
    # Load tasks
    tasks_path = Path(__file__).parent.parent / 'apps' / 'web' / 'data' / 'tasks.levels.json'

    with open(tasks_path, 'r') as f:
        tasks = json.load(f)

    print(f"Processing {len(tasks)} tasks...")

    # Generate descriptions
    for i, task in enumerate(tasks, 1):
        old_desc = task['description']
        new_desc = generate_task_description(task)
        task['description'] = new_desc

        if i <= 5:  # Show first 5 as examples
            print(f"\n{task['id']}:")
            print(f"  Old: {old_desc}")
            print(f"  New: {new_desc}")

    # Save enhanced tasks
    with open(tasks_path, 'w') as f:
        json.dump(tasks, f, indent=2)

    print(f"\n✅ Successfully updated {len(tasks)} task descriptions!")
    print(f"📝 File saved to: {tasks_path}")

if __name__ == '__main__':
    main()
