#!/usr/bin/env python3
"""
Add human-readable labels to test cases
"""
import json
from pathlib import Path

def generate_test_label(test_id, test_code):
    """Generate a human-readable label for a test"""

    # Common test ID patterns
    label_map = {
        'h1': 'Has <h1> heading',
        'h2': 'Has <h2> heading',
        'p': 'Has paragraph',
        'ul': 'Has unordered list',
        'ol': 'Has ordered list',
        'li3': 'Has 3+ list items',
        'a': 'Has link element',
        'blank': 'Opens in new tab',
        'img': 'Has image with alt',
        'table': 'Has table element',
        'form': 'Has form element',
        'input': 'Has input field',
        'button': 'Has button',
        'div': 'Has div container',
        'span': 'Has span element',
        'nav': 'Has navigation',
        'header': 'Has header',
        'footer': 'Has footer',
        'section': 'Has section',
        'article': 'Has article',
        'hello': 'Renders correctly',
        'sample': 'Basic test passes',
    }

    # Check if we have a direct mapping
    if test_id in label_map:
        return label_map[test_id]

    # Parse from code
    if "querySelector('h1')" in test_code:
        return "Has <h1> heading"
    if "querySelector('h2')" in test_code:
        return "Has <h2> heading"
    if "querySelector('p')" in test_code:
        return "Has paragraph"
    if "querySelector('ul')" in test_code:
        return "Has unordered list"
    if "querySelectorAll('ul li').length>=3" in test_code:
        return "Has 3+ list items"
    if 'href="https://example.com"' in test_code and 'target' not in test_code:
        return "Links to example.com"
    if "target==='_blank'" in test_code:
        return "Opens in new tab"
    if "querySelector('img[alt]')" in test_code:
        return "Image has alt text"
    if "querySelector('table')" in test_code:
        return "Has table element"
    if "getComputedStyle" in test_code:
        if "color" in test_code or "Color" in test_code:
            return "Text color is styled"
        if "backgroundColor" in test_code:
            return "Background color set"
        if "fontSize" in test_code:
            return "Font size is set"
        if "display" in test_code and "flex" in test_code:
            return "Uses flexbox"
        if "display" in test_code and "grid" in test_code:
            return "Uses CSS grid"
        return "Styling applied"
    if "addEventListener" in test_code:
        return "Event listener added"
    if "innerHTML" in test_code or "textContent" in test_code:
        return "Content updates dynamically"
    if "classList" in test_code:
        return "Manipulates CSS classes"
    if "useState" in test_code:
        return "Uses useState hook"
    if "useEffect" in test_code:
        return "Uses useEffect hook"

    # Fallback - capitalize test ID
    return test_id.replace('_', ' ').replace('-', ' ').title()

def main():
    # Load tasks
    tasks_path = Path(__file__).parent.parent / 'apps' / 'web' / 'data' / 'tasks.levels.json'

    with open(tasks_path, 'r') as f:
        tasks = json.load(f)

    print(f"Adding labels to tests in {len(tasks)} tasks...")

    # Add labels to tests
    for task in tasks:
        for test in task['tests']:
            if 'label' not in test:
                test['label'] = generate_test_label(test['id'], test['code'])

    # Show examples
    print("\nExamples:")
    for i, task in enumerate(tasks[:3], 1):
        print(f"\n{task['id']}:")
        for test in task['tests']:
            print(f"  ✓ {test['label']}")

    # Save
    with open(tasks_path, 'w') as f:
        json.dump(tasks, f, indent=2)

    print(f"\n✅ Successfully added labels to all tests!")
    print(f"📝 File saved to: {tasks_path}")

if __name__ == '__main__':
    main()
