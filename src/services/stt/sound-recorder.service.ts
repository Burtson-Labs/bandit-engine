/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-17BC-5CBAB9
const __banditFingerprint_stt_soundrecorderservicets = 'BL-FP-A3A6BF-2B75';
const __auditTrail_stt_soundrecorderservicets = 'BL-AU-MGOIKVVZ-9DDJ';
// File: sound-recorder.service.ts | Path: src/services/stt/sound-recorder.service.ts | Hash: 17bc2b75

import { first, from, fromEvent, map, Observable, shareReplay, switchMap } from "rxjs";
import { createAudioBlob } from "./create-audio-blob";

export class SoundRecorderService {
    private _mediaRecorder?: Observable<MediaRecorder>;


    start(): Observable<Blob> {

        const mediaStream = from(navigator.mediaDevices.getUserMedia({ audio: true }));

        this._mediaRecorder = mediaStream.pipe(map(stream => {
            const rec = new MediaRecorder(stream)
            rec.start();
            return rec;
        }), shareReplay(1));

        const dataAvailableEvent = this._mediaRecorder.pipe(
            switchMap(recorder => fromEvent<BlobEvent>(recorder, 'dataavailable'))
        );

        const blob = dataAvailableEvent.pipe(
            first(),
            map((event) => createAudioBlob(event.data)),
            shareReplay(1)
        );

        return blob;
    }


    stop() {
        if (!this._mediaRecorder) {
            return;
        }

        this._mediaRecorder.pipe(first()).subscribe(recorder => {
            recorder.stop();
        });
    }


}
