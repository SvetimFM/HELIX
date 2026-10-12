"""Offline Chromium tests. Embeds ESM core into an isolated document to avoid localhost network policy.
Run: python tests/browser_smoke.py
This does NOT replace a real-host integration test on GitHub Pages.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
core=(root/'src/grammar.mjs').read_text().replace('export const ','const ').replace('export function ','function ')
html=(root/'index.html').read_text()
html=html.replace('<script type="module">','<script>')
html=html.replace("import {VERSION,OP,example,normalize,encode,decode,overlay,project,abstractUp,refinements,reconstruct,toInstrumentScene} from './src/grammar.mjs';",core)
instrument=(root/'instrument.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    results={}
    for name,size in [('desktop',{'width':1440,'height':950}),('tablet',{'width':820,'height':1180}),('phone',{'width':390,'height':844})]:
        page=browser.new_page(viewport=size,device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        page.screenshot(path=str(root/'tests'/f'grammar_{name}.png'),full_page=True)
        assert page.locator('body').get_attribute('class')=='ready',(name,errors,page.locator('#status').inner_text())
        assert page.locator('#nObjects').inner_text()=='10'
        assert page.locator('#nFacts').inner_text()=='15'
        if name=='desktop':
            page.locator('#title').fill('A new experiential language')
            page.locator('#title').dispatch_event('change')
            assert page.locator('#stageTitle').inner_text()=='A new experiential language'
            original=page.locator('#source').input_value()
            assert original.startswith('⟦ HGL1')
            page.locator('#source').fill(original.replace('A new experiential language','Convergence of worlds'))
            page.locator('#decode').click()
            assert page.locator('#title').input_value()=='Convergence of worlds'
            page.locator('#checkViews').click()
            assert 'relation' in page.locator('#status').inner_text().lower() or 'visible' in page.locator('#status').inner_text().lower()
            page.locator('#symbolSort').select_option('event')
            page.locator('#symbolId').fill('newleaf')
            page.locator('#symbolLabel').fill('A novel future')
            page.locator('#addSymbol').click()
            assert page.locator('#nObjects').inner_text()=='11'
            page.locator('#op').select_option('BEFORE')
            page.locator('#arg1').select_option('attempt')
            page.locator('#arg2').select_option('newleaf')
            page.locator('#addFact').click()
            assert page.locator('#nFacts').inner_text()=='16',page.locator('#status').inner_text()
            hgl=page.locator('#source').input_value()
            score=page.evaluate('HELIX_GRAMMAR.toInstrumentScene(HELIX_GRAMMAR.getDocument())')
            assert len(score['notes'])==6
            page.close()
            page=browser.new_page(viewport=size,device_scale_factor=1)
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(instrument,wait_until='load')
            page.evaluate('(s)=>HELIX.setScene(s)',score)
            assert page.locator('body').get_attribute('class')=='ready'
            assert page.locator('#noteList .item').count()==6
            assert page.locator('#idea').input_value()=='Convergence of worlds'
            page.evaluate('(doc)=>window.HELIX_HGL_DOCUMENT=doc',hgl)
            midi_check=page.evaluate('()=>({hasHgl:new TextDecoder().decode(HELIX.midiBytes()).includes("HELIX_HGL1:"),roundTrip:HELIX.canonical(HELIX.readMidi(HELIX.midiBytes()))===HELIX.canonical(HELIX.getScene())})')
            assert midi_check['hasHgl'] and midi_check['roundTrip'],midi_check
            page.locator('#playChord').click()
            page.wait_for_timeout(400)
            assert page.locator('#playState').inner_text()!='Silent'
            page.locator('#stopSound').click()
            results['cross_app']={'imported_notes':6,'audio':'started; simulated transfer'}
        results[name]={'ready':True,'errors':errors}
        assert not errors,errors
        page.close()
    browser.close()
    print(json.dumps(results,indent=2))
    (root/'tests'/'browser_results.json').write_text(json.dumps(results,indent=2))
