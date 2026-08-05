from playwright.sync_api import sync_playwright

URL = 'http://localhost:5173/question/q-calculus-1-c1-m2-011'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)

    print('=== 初始页面内容 ===')
    print(page.locator('.question-card').first.inner_text()[:800])

    checkboxes = page.locator('.question-card input[type="checkbox"]')
    print(f'checkbox count: {checkboxes.count()}')

    # 选择 A 和 C（索引 0 和 2）
    if checkboxes.count() > 2:
        checkboxes.nth(0).click()
        page.wait_for_timeout(200)
        checkboxes.nth(2).click()
        page.wait_for_timeout(200)

        # 点击提交
        submit = page.locator('[data-action="submit-answer"]')
        submit.click()
        page.wait_for_timeout(1000)

        print('\n=== 提交后页面内容 ===')
        print(page.locator('.question-card').first.inner_text()[:1000])
        page.screenshot(path='test-multichoice.png', full_page=False)

    browser.close()
