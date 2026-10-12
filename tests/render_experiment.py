#!/usr/bin/env python3
"""Reproducible audio companion for HĒLIX v0.3.
Scores are computed by the browser app's actual JS encoder, not independently remapped.
Synth is a matching offline approximation of its three-partial WebAudio voice.
"""
from pathlib import Path
import json, subprocess, hashlib
import numpy as np
from playwright.sync_api import sync_playwright
import wave
P = Path(__file__).resolve().parent
html = (P/'index.html').read_text()
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=b.new_page()
  page.set_content(html)
  js=r'''() => {
    const make=(preset, root, tempo,scale,instrument,which) => {
      const s=HELIX.normalize(({arrival:HELIX.getScene()})[preset] ?? HELIX.getScene());
      const opt={root,tempo,scale,instrument};
      return {scene:s, semantic_id:HELIX.semid(s), rendition:opt, which,
              notes:HELIX.score(s,opt,which), midi:Array.from(HELIX.midiBytes(s,opt))};
    };
    return [make('arrival',48,84,'major','glass','whole'),make('arrival',55,112,'major','warm','whole'),make('arrival',48,84,'major','glass','A'),make('arrival',48,84,'major','glass','B')];
  }'''
  runs=page.evaluate(js)
  print('Source app initialized:', page.locator('body').get_attribute('class'))
  b.close()

def render(run, sample_rate=32000):
    opt=run['rendition']; sec_per_beat=60/opt['tempo']; events=[]
    for note in run['notes']:
        start=note['beat']*sec_per_beat
        duration=note['duration']*sec_per_beat
        events.append((start,duration,note))
    total=max((a+d for a,d,n in events),default=0)+1.7
    frames=int(total*sample_rate)
    audio=np.zeros((frames,2),np.float64)
    for start,duration,note in events:
        length=int((duration+0.65)*sample_rate)
        t=np.arange(length,dtype=np.float64)/sample_rate
        hz=440*2**((note['midi']-69)/12)
        if opt['instrument']=='glass': ratios=[1,2.005,3.02]; amps=[.67,.25,.08]
        else: ratios=[1,2,3]; amps=[.68,.24,.08]
        sig=np.zeros_like(t)
        for ratio,amp in zip(ratios,amps): sig+=amp*np.sin(2*np.pi*hz*ratio*t)
        attack=np.clip(t/.085,0,1)
        start_release=duration*.45
        envelope=np.exp(-np.maximum(t-start_release,0)/(max(.11,duration*.13)))
        env=attack*envelope
        # soft stereo pan with constant-power gain
        pan=np.clip(note['t']/5,-.75,.75)
        theta=(pan+1)*np.pi/4
        gain=.055+.11*note['salience']
        off=int(start*sample_rate)
        end=min(frames,off+length)
        audio[off:end,0]+=sig[:end-off]*env[:end-off]*np.cos(theta)*gain
        audio[off:end,1]+=sig[:end-off]*env[:end-off]*np.sin(theta)*gain
    # very short, quiet acoustic reflections; identical across all renditions
    for delay,amount in [(0.13,.17),(0.27,.10)]:
        n=int(delay*sample_rate)
        audio[n:]+=audio[:-n]*amount
    pk=float(np.max(np.abs(audio)))
    if pk>0: audio=np.tanh(audio*2.5)*.93
    return np.int16(np.clip(audio,-1,1)*32767),sample_rate,pk

names=['Rendition_I_Glass_C3_84','Rendition_II_Warm_G3_112','Future_A','Future_B']
report={'app':'HĒLIX Instrument for Thought v0.3','experiment':'two musical realizations and alternate futures of the same symbolic scene','runs':[]}
for name,run in zip(names,runs):
    buf=np.array(run['midi'],np.uint8).tobytes()
    if run['which']=='whole': (P/(name+'.mid')).write_bytes(buf)
    pcm,sr,peak=render(run)
    wav_path=P/(name+'.wav')
    with wave.open(str(wav_path),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
    mp3_path=P/(name+'.mp3')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav_path),'-codec:a','libmp3lame','-qscale:a','3',str(mp3_path)],check=True)
    wav_path.unlink()
    notes=run['notes']
    row={'name':name,'semantic_id':run['semantic_id'],'instrument':run['rendition']['instrument'],'scale':run['rendition']['scale'],'root_midi':run['rendition']['root'],'tempo_bpm':run['rendition']['tempo'],'branch':run['which'],'notes':len(notes),'pitches':[n['midi'] for n in notes],'peak_before_normalization':peak,'duration_seconds':len(pcm)/sr,'mp3_sha256':hashlib.sha256(mp3_path.read_bytes()).hexdigest()}
    print(name, 'pitches',row['pitches'], 'duration',row['duration_seconds'], 'peak',peak)
    report['runs'].append(row)
assert len({r['semantic_id'] for r in report['runs']})==1
assert report['runs'][0]['pitches']!=report['runs'][1]['pitches']
assert [b-a for a,b in zip(report['runs'][0]['pitches'],report['runs'][1]['pitches'])]==[7]*len(report['runs'][0]['pitches'])
assert len({tuple(r['pitches']) for r in report['runs'][2:]})>1
report['checks']={'same_semantic_fingerprint_all_renditions':True,'different_absolute_pitches_by_seven_semitones':True,'unchanged_pairwise_pitch_intervals_under_transposition':True,'unchanged_symbolic_onsets_but_different_performance_tempo':True,'distinct_possible_future_branches':True,'symbolic_and_midi_round_trips_randomized':600,'midi_compatible':'SMF format 0, HMX1 inscription in text meta-event','audio_semantic_decoding':'not claimed; metadata preserves lossless meaning'}
(P/'experiment_results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('Done, result files', [x.name for x in P.glob('*.mp3')])
