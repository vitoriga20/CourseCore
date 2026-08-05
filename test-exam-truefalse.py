from playwright.sync_api import sync_playwright

URL = 'http://localhost:5173/exams/calculus-1-c1/questions/q-calculus-1-c1-m1-004'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)

    print('=== 初始页面内容 ===')
    print(page.locator('.question-card').first.inner_text()[:600])

    radios = page.locator('.question-card input[type="radio"]')
    print(f'radio count: {radios.count()}')

    # 选择正确（索引0）
    if radios.count() > 0:
        radios.nth(0).click()
        page.wait_for_timeout(1200)
        print('\n=== 选择正确后 URL ===')
        print(page.url)
        print('\n=== 选择正确后页面内容 ===')
        print(page.locator('.question-card').first.inner_text()[:800])
        page.screenshot(path='test-exam-truefalse.png', full_page=False)

    browser.close()
