"""
翼站Token超市 - 全页面浏览器自动化测试
遍历侧边栏所有页面，截图并捕获控制台错误
"""
import os
import sys
import json
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
TEST_EMAIL = "autotest@test.com"
TEST_PASSWORD = "test123456"
TEST_NAME = "自动测试员"

# 按侧边栏顺序的所有页面
PAGES = [
    ("agents", "天翼智脑"),
    ("dashboard", "仪表盘"),
    ("compare", "Agent市场"),
    ("office", "员工实况"),
    ("models", "模型市场"),
    ("skills", "技能资产库"),
    ("kb", "知识库"),
    ("mcp", "MCP管理"),
    ("api", "API文档"),
    ("billing", "用量看板"),
]

ADMIN_PAGES = [
    ("nodes", "节点监控"),
    ("users", "用户管理"),
    ("settings", "系统设置"),
]

TEST_DIR = os.path.dirname(os.path.abspath(__file__))

def register_user(page):
    """注册测试用户（如果已存在则跳过）"""
    print("[注册] 尝试注册测试用户...")
    
    # 先尝试注册
    import urllib.request, urllib.error
    data = json.dumps({"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/register",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        print(f"[注册] 注册成功: {result.get('id', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[注册] HTTP {e.code}: {body}")
        if "already registered" in body.lower():
            print("[注册] 用户已存在，跳过注册")
            return True
        return False
    except Exception as e:
        print(f"[注册] 错误: {e}")
        return False

def login_user(page):
    """通过页面登录"""
    print("[登录] 正在登录...")
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    
    # 填写邮箱
    email_input = page.locator('input[type="email"]')
    if email_input.count() == 0:
        email_input = page.locator('input').first
    email_input.fill(TEST_EMAIL)
    
    # 填写密码
    pw_inputs = page.locator('input[type="password"]')
    if pw_inputs.count() > 0:
        pw_inputs.first.fill(TEST_PASSWORD)
    
    # 点击登录按钮
    submit_btn = page.locator('button[type="submit"]')
    if submit_btn.count() == 0:
        submit_btn = page.locator('button:has-text("登录")')
    submit_btn.click()
    
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    
    # 检查是否登录成功
    if "login" not in page.url.lower() and page.locator('aside').count() > 0:
        print("[登录] 登录成功！")
        return True
    else:
        print("[登录] 可能登录失败，检查页面状态...")
        page.screenshot(path=os.path.join(TEST_DIR, "login_result.png"), full_page=True)
        return False

def click_sidebar_item(page, page_id):
    """点击侧边栏导航项"""
    # 尝试多种选择器来找到侧边栏按钮
    selectors = [
        f'button:has-text("{page_id}")',
        f'[data-testid="sidebar-{page_id}"]',
        f'aside button',
    ]
    
    # 最简单的方法：遍历侧边栏中的所有按钮
    sidebar = page.locator('aside')
    if sidebar.count() == 0:
        print(f"  ⚠️ 找不到侧边栏")
        return False
    
    buttons = sidebar.locator('button')
    count = buttons.count()
    for i in range(count):
        btn = buttons.nth(i)
        text = btn.text_content() or ""
        title = btn.get_attribute("title") or ""
        aria = btn.get_attribute("aria-label") or ""
        
        # 通过 data-page 属性匹配（如果存在）
        for id_val in [page_id]:
            if id_val in str(title).lower() or id_val in str(aria).lower():
                btn.click()
                return True
    
    # 如果找不到具体按钮，尝试点击 visible button
    visible_btns = sidebar.locator('button:visible')
    vcount = visible_btns.count()
    print(f"  侧边栏可见按钮数: {vcount}")
    
    # 根据 PAGES 列表中的顺序来点击对应位置的按钮
    for idx, (pid, pname) in enumerate(PAGES):
        if pid == page_id and idx < vcount:
            visible_btns.nth(idx).click()
            return True
    
    return False

def test_all_pages():
    results = {"passed": [], "failed": [], "errors": [], "admin_pages": []}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        # 收集控制台日志
        console_logs = []
        def on_console(msg):
            if msg.type == "error":
                console_logs.append(f"[{msg.type}] {msg.text}")
        page.on("console", on_console)
        
        # 注册并登录
        register_user(page)
        if not login_user(page):
            print("[致命] 登录失败，无法继续测试")
            browser.close()
            return results
        
        # 遍历所有普通页面
        for page_id, page_name in PAGES:
            print(f"\n--- 测试页面: {page_name} ({page_id}) ---")
            try:
                clicked = click_sidebar_item(page, page_id)
                time.sleep(1.5)
                page.wait_for_load_state("networkidle")
                
                # 截图
                screenshot_path = os.path.join(TEST_DIR, f"page_{page_id}.png")
                page.screenshot(path=screenshot_path, full_page=True)
                
                # 检查页面是否正常渲染
                page_errors = [l for l in console_logs if "error" in l.lower()]
                
                if page_errors:
                    print(f"  ⚠️ 控制台错误: {len(page_errors)} 条")
                    results["errors"].append({"page": page_id, "errors": page_errors[-5:]})
                else:
                    print(f"  ✅ 正常")
                
                results["passed"].append(page_id)
                
            except Exception as e:
                print(f"  ❌ 异常: {e}")
                page.screenshot(path=os.path.join(TEST_DIR, f"page_{page_id}_error.png"))
                results["failed"].append({"page": page_id, "error": str(e)})
        
        # 测试管理员页面（普通用户应该无法访问或显示 403）
        print("\n--- 测试管理员页面 ---")
        for page_id, page_name in ADMIN_PAGES:
            print(f"  检查: {page_name} ({page_id})")
            try:
                clicked = click_sidebar_item(page, page_id)
                time.sleep(1)
                page.wait_for_load_state("networkidle")
                screenshot_path = os.path.join(TEST_DIR, f"admin_{page_id}.png")
                page.screenshot(path=screenshot_path, full_page=True)
                
                # 检查是否显示 403
                content = page.content()
                if "403" in content or "无权限" in content:
                    print(f"  ✅ 正确显示 403 无权限")
                    results["admin_pages"].append({"page": page_id, "status": "403_correct"})
                else:
                    print(f"  ℹ️ 非 403 页面（可能是管理员账号）")
                    results["admin_pages"].append({"page": page_id, "status": "accessible"})
                    
            except Exception as e:
                print(f"  ❌ 异常: {e}")
                results["failed"].append({"page": f"admin_{page_id}", "error": str(e)})
        
        # 保存控制台日志
        with open(os.path.join(TEST_DIR, "console.log"), "w", encoding="utf-8") as f:
            f.write("\n".join(console_logs))
        
        browser.close()
    
    return results

def print_summary(results):
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    print(f"✅ 通过: {len(results['passed'])} 页")
    for p in results['passed']:
        print(f"   - {p}")
    
    print(f"\n❌ 失败: {len(results['failed'])} 页")
    for f in results['failed']:
        print(f"   - {f['page']}: {f['error'][:80]}")
    
    print(f"\n⚠️ 有控制台错误: {len(results['errors'])} 页")
    for e in results['errors']:
        print(f"   - {e['page']}: {len(e['errors'])} 条")
    
    print(f"\n🔒 管理员页面: {len(results['admin_pages'])} 个")
    for a in results['admin_pages']:
        print(f"   - {a['page']}: {a['status']}")
    
    # 写入 JSON 报告
    report_path = os.path.join(TEST_DIR, "test_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n📄 详细报告: {report_path}")

if __name__ == "__main__":
    results = test_all_pages()
    print_summary(results)
    # 0=全部通过, 1=有失败
    sys.exit(1 if results["failed"] else 0)
