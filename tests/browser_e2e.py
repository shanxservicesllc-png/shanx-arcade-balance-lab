"""Run local Chromium Playwright tests with zero network, no installs required when available."""
import json
import pathlib
import re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'evidence'
EVIDENCE.mkdir(exist_ok=True)
RESULTS = []

def inline_app():
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    css=(ROOT/'src/style.css').read_text(encoding='utf-8')
    html=html.replace('<link rel="stylesheet" href="src/style.css">','<style>'+css+'</style>')
    for name in ('engine','export','app'):
        code=(ROOT/f'src/{name}.js').read_text(encoding='utf-8')
        # Prevent HTML parser treating the exporter template's literal closing tag as a script boundary.
        code=code.replace('</script>', '<\\/script>')
        html=html.replace(f'<script src="src/{name}.js"></script>','<script>'+code+'</script>')
    return html

def assert_empty(values):
    assert not values, values

def record(name, action):
    try:
        action()
        RESULTS.append({'case':name,'status':'PASS'})
        print('PASS',name)
    except Exception as ex:
        RESULTS.append({'case':name,'status':'FAIL','error':str(ex)})
        print('FAIL',name,ex)
        raise

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width':1440,'height':1000}, accept_downloads=True)
    context.set_default_timeout(5000)
    context.set_offline(True)
    page = context.new_page()
    # The sandbox Chromium policy blocks navigation and OS-level downloads.
    # Intercept only the final anchor click, preserving the app's real Blob creation.
    page.add_init_script('window.__ignored = true')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    remote = []
    page.on('request', lambda req: remote.append(req.url) if req.url.startswith('http') else None)
    source = inline_app()
    record('load complete main UI in offline browser',lambda: (page.set_content(source),page.locator('#difficulty').wait_for(),page.get_by_text('Make it fair.').wait_for()))
    assert page.locator('#board .tile').count() == 16
    fingerprint = page.locator('#fingerprint').inner_text()
    assert len(fingerprint)==8
    record('same-seed deterministic re-run', lambda: (page.locator('#verify-button').click(),page.get_by_text('PASS · Replay identical',exact=False).wait_for()))
    def invalid():
        page.locator('#pairs').fill('9')
        page.locator('#build').click()
        page.locator('#error').get_by_text('Pairs must',exact=False).wait_for()
        assert page.locator('#fingerprint').inner_text()==fingerprint
        page.locator('#pairs').fill('8')
        page.locator('#build').click()
        assert page.locator('#error').is_hidden()
    record('bad pair count fails safely and preserves current board',invalid)
    def play():
        # Card zero is paired to first equal-position, introspect from engine on this local test page.
        a,b=page.evaluate("""() => {const p=ArcadeEngine.build({rows:4,cols:4,pairs:8,hints:2,seed:'SXS-0426'});return [0,p.layout.findIndex((n,i)=>i!==0&&n===p.layout[0])]}""")
        page.locator(f'#board .tile').nth(a).click()
        page.locator(f'#board .tile').nth(b).click()
        assert page.locator('#matched').inner_text()=='1/8'
        assert page.locator('#moves').inner_text()=='1'
        page.locator('#hint-button').click()
        assert page.locator('#matched').inner_text()=='2/8'
        assert page.locator('#hints-left').inner_text()=='1'
        page.locator('#restart-button').click()
        assert page.locator('#matched').inner_text()=='0/8'
    record('actual matching cards, hint and reset controls',play)
    def preset():
        page.locator('[data-size="3x4"]').click()
        page.locator('#pairs').fill('4')
        page.locator('#build').click()
        assert page.locator('#board .tile').count()==12
        assert page.locator('#board .tile.empty').count()==4
        assert page.locator('#difficulty').inner_text() in ('GENTLE','BALANCED','TRICKY')
        page.locator('[data-size="4x4"]').click()
        page.locator('#build').click()
    record('12-tile preset and empty disabled cells',preset)
    def install_download_probe():
        page.evaluate("""() => {
          window.__capturedDownloads=[];window.__blobs=[];
          const old=URL.createObjectURL.bind(URL);
          URL.createObjectURL=blob=>{window.__blobs.push(blob);return old(blob)};
          HTMLAnchorElement.prototype.click=function(){window.__capturedDownloads.push(this.download)};
        }""")
    install_download_probe()
    def html_export():
        page.locator('#export-html').click()
        name=page.evaluate('window.__capturedDownloads.at(-1)')
        assert name.startswith('arcade-puzzle-')
        target = EVIDENCE/'downloaded_playable.html'
        target.write_text(page.evaluate('async () => await window.__blobs.at(-1).text()'),encoding='utf-8')
        out = context.new_page()
        try:
            out_errors=[]; out.on('pageerror', lambda e:out_errors.append(str(e)))
            out.set_content(target.read_text(encoding='utf-8'))
            assert out.locator('#board .tile').count()==16
            assert out.locator('#fingerprint').inner_text()==page.locator('#fingerprint').inner_text()
            out.locator('#hint').click()
            assert out.locator('#pairs').inner_text()=='1/8'
            out.locator('#reset').click()
            assert out.locator('#pairs').inner_text()=='0/8'
            assert not out_errors,out_errors
        finally:
            out.close()
    record('HTML export button produces playable Blob; offline browser playback',html_export)
    def json_export():
        page.locator('#export-json').click()
        assert page.evaluate('window.__capturedDownloads.at(-1)').startswith('arcade-report-')
        target=EVIDENCE/'downloaded_report.json'
        target.write_text(page.evaluate('async () => await window.__blobs.at(-1).text()'), encoding='utf-8')
        data=json.loads(target.read_text())
        assert data['puzzle']['fingerprint']==page.locator('#fingerprint').inner_text()
        assert data['analysis']['solvable'] is True
        assert len(data['puzzle']['layout'])==16
    record('JSON export button produces valid report Blob',json_export)
    record('no JS errors and no remote requests',lambda: (assert_empty(errors), assert_empty(remote)))
    page.screenshot(path=str(EVIDENCE/'desktop_ui.png'),full_page=True)
    mobile = browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile.set_offline(True)
    m=mobile.new_page()
    def narrow():
        m.set_content(source)
        m.locator('#board .tile').first.wait_for()
        assert m.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    record('mobile width without horizontal overflow',narrow)
    m.screenshot(path=str(EVIDENCE/'mobile_ui.png'),full_page=True)
    mobile.close();context.close();browser.close()

(EVIDENCE/'browser_results.json').write_text(json.dumps(RESULTS,indent=2)+'\n',encoding='utf-8')
print(f'{len(RESULTS)} browser tests passed')
