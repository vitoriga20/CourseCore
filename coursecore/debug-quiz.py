from playwright.sync_api import sync_playwright
import sys

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173/item/c1-m1-i10'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Check for main quiz content
    quiz = page.locator('.quiz-session')
    print('quiz-session count:', quiz.count())

    # Check question cards
    cards = page.locator('.question-card')
    print('question-card count:', cards.count())

    # Check any visible content
    main = page.locator('#main')
    if main.count():
        print('main text length:', main.first.inner_text().strip()[:500])

    # Take screenshot
    page.screenshot(path='debug-quiz.png', full_page=True)
    print('screenshot saved to debug-quiz.png')

    browser.close()
