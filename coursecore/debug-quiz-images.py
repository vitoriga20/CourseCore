from playwright.sync_api import sync_playwright
import sys

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5174/item/p1b-m1-02-training'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f'[CONSOLE {msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
    page.on('response', lambda resp: print(f'[RESPONSE] {resp.status} {resp.url}') if resp.url.endswith(('.jpg','.png','.svg')) else None)
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Check all images
    imgs = page.locator('.quiz-session img, .question-card img, .quiz-question-content img').all()
    print(f'image count: {len(imgs)}')
    for i, img in enumerate(imgs):
        src = img.get_attribute('src')
        complete = img.evaluate('el => el.complete')
        natural_width = img.evaluate('el => el.naturalWidth')
        natural_height = img.evaluate('el => el.naturalHeight')
        print(f'img {i}: src={src}, complete={complete}, naturalWidth={natural_width}, naturalHeight={natural_height}')

    # Find skeletons
    skeletons = page.locator('.image-skeleton, .img-skeleton, [class*="skeleton"]').all()
    print(f'skeleton count: {len(skeletons)}')

    # Get HTML around image
    quiz = page.locator('.quiz-session').first
    if quiz:
        html = quiz.inner_html()
        # Find img tags
        import re
        img_tags = re.findall(r'<img[^>]+>', html)
        print(f'raw img tags in quiz: {len(img_tags)}')
        for tag in img_tags[:5]:
            print(tag[:200])

    page.screenshot(path='debug-quiz-images.png', full_page=True)
    print('screenshot saved to debug-quiz-images.png')

    browser.close()
