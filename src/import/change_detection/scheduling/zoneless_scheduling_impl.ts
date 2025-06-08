/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { inject } from '../../di/injector_compatibility';
import { scheduleCallbackWithRafRace } from '../../util/callback_scheduler';

import { ChangeDetectionScheduler, NotificationSource } from './zoneless_scheduling';
import { EffectScheduler } from 'src/import/render3/reactivity/root_effect_scheduler';

export class ChangeDetectionSchedulerImpl implements ChangeDetectionScheduler {
  runningTick = false;
  #rootEffectScheduler = inject(EffectScheduler);
  private cancelScheduledCallback: null | (() => void) = null;

  notify(source: NotificationSource): void {
    this.cancelScheduledCallback = scheduleCallbackWithRafRace(() => {
      this.#rootEffectScheduler.flush();
    });
  }
  private cleanup() {
    this.runningTick = false;
    this.cancelScheduledCallback?.();
    this.cancelScheduledCallback = null;
  }
  ngOnDestroy() {
    this.cleanup();
  }
}
