from playwright.sync_api import sync_playwright

URL = 'http://localhost:5173/item/c1-m1-i2'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print('=== 初始页面内容 ===')
    main_text = page.locator('#main').inner_text()
    print(main_text[:1200])

    # 找到判断题
    articles = page.locator('article.inline-question')
    print(f'inline question count: {articles.count()}')

    for i in range(articles.count()):
        art = articles.nth(i)
        kind = art.locator('.kind-tag').inner_text()
        if '判断' in kind:
            print(f'\n=== 判断题 {i} ===')
            print(art.inner_text()[:600])
            radios = art.locator('input[type="radio"]')
            print(f'radios: {radios.count()}')
            # 选择第一个选项
            radios.nth(0).click()
            page.wait_for_timeout(300)

    # 提交本节
    submit = page.locator('[data-action="submit-item"]')
    print(f'submit button count: {submit.count()}')
    if submit.count() > 0:
        submit.first.click()
        page.wait_for_timeout(1500)
        page.screenshot(path='test-truefalse-inline.png', full_page=True)
        print('\n=== 提交后页面内容 ===')
        print(page.locator('#main').inner_text()[:1500])

    browser.close()
