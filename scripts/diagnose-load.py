from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture network requests and console logs
    requests = []
    page.on("request", lambda r: requests.append({
        "url": r.url,
        "method": r.method,
        "resource_type": r.resource_type,
    }))
    page.on("response", lambda r: requests.append({
        "url": r.url,
        "status": r.status,
        "content_type": r.headers.get("content-type", ""),
        "size": r.headers.get("content-length", "unknown"),
    }))

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    page.goto("http://localhost:4173/")
    page.wait_for_load_state("networkidle")

    # Measure navigation timing
    timing = page.evaluate("""() => {
      const p = performance.timing;
      return {
        dns: p.domainLookupEnd - p.domainLookupStart,
        connect: p.connectEnd - p.connectStart,
        ttfb: p.responseStart - p.requestStart,
        download: p.responseEnd - p.responseStart,
        domInteractive: p.domInteractive - p.navigationStart,
        domComplete: p.domComplete - p.navigationStart,
        loadComplete: p.loadEventEnd - p.navigationStart,
      };
    }""")

    print("=== Navigation Timing (ms) ===")
    print(json.dumps(timing, indent=2))

    print("\n=== Console Logs ===")
    for log in console_logs[:50]:
        print(log)

    print("\n=== Requests ===")
    for req in requests:
        print(req)

    browser.close()
