'use client';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { SlidersHorizontal, X } from 'lucide-react';
import { ROLE_DEFAULTS, useComfort } from './ComfortProvider';

export function ComfortSheet({ triggerLabel = 'Comfort' }: { triggerLabel?: string }) {
  const { comfort, set } = useComfort();
  const sizes = [0, 1, 2] as const;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="inline-flex min-h-hit min-w-hit items-center justify-center gap-2 rounded-m px-4 font-semibold text-nile hover:bg-nile-tint">
          <SlidersHorizontal aria-hidden className="h-5 w-5" />
          {triggerLabel}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/35" />
        <Dialog.Content className="fixed right-0 top-0 z-[101] h-[100dvh] w-full max-w-[420px] overflow-y-auto border-l border-hairline bg-surface p-5 shadow-2 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl">Comfort settings</Dialog.Title>
              <Dialog.Description className="mt-1 text-base text-ink-3">Make the workspace easier to read and use.</Dialog.Description>
            </div>
            <Dialog.Close asChild><button type="button" aria-label="Close comfort settings" className="grid h-11 w-11 shrink-0 place-items-center rounded-m border border-hairline text-xl">X</button></Dialog.Close>
          </div>

          <fieldset className="mt-6"><legend className="text-lg font-semibold">Text size</legend><div className="mt-2 grid grid-cols-3 gap-2">{sizes.map(value => <button key={value} type="button" onClick={() => set({ textSize: value })} aria-pressed={comfort.textSize === value} className={`min-h-[56px] rounded-m border-2 px-2 ${comfort.textSize === value ? 'border-nile bg-nile-tint' : 'border-hairline'}`}><span className={value === 0 ? 'text-base' : value === 1 ? 'text-lg' : 'text-xl'}>Aa</span><span className="sr-only">Text size {value + 1}</span></button>)}</div></fieldset>

          <fieldset className="mt-6"><legend className="text-lg font-semibold">Contrast</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" aria-pressed={comfort.contrast === 'standard'} onClick={() => set({ contrast: 'standard' })} className={`min-h-hit rounded-m border-2 ${comfort.contrast === 'standard' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>Standard</button><button type="button" aria-pressed={comfort.contrast === 'high'} onClick={() => set({ contrast: 'high' })} className={`min-h-hit rounded-m border-2 ${comfort.contrast === 'high' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>High contrast</button></div></fieldset>

          <fieldset className="mt-6"><legend className="text-lg font-semibold">Motion</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" aria-pressed={comfort.motion === 'full'} onClick={() => set({ motion: 'full' })} className={`min-h-hit rounded-m border-2 ${comfort.motion === 'full' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>Full motion</button><button type="button" aria-pressed={comfort.motion === 'reduced'} onClick={() => set({ motion: 'reduced' })} className={`min-h-hit rounded-m border-2 ${comfort.motion === 'reduced' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>Reduced motion</button></div></fieldset>

          <fieldset className="mt-6"><legend className="text-lg font-semibold">Theme</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" aria-pressed={comfort.theme === 'daylight'} onClick={() => set({ theme: 'daylight' })} className={`min-h-hit rounded-m border-2 ${comfort.theme === 'daylight' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>Daylight</button><button type="button" aria-pressed={comfort.theme === 'room'} onClick={() => set({ theme: 'room' })} className={`min-h-hit rounded-m border-2 ${comfort.theme === 'room' ? 'border-nile bg-nile-tint' : 'border-hairline'}`}>Situation Room</button></div></fieldset>

          <div className="mt-6 flex min-h-[56px] items-center justify-between gap-4"><div><p className="font-semibold">Simple mode</p><p className="text-sm text-ink-3">Hide secondary widgets and keep the main tasks visible.</p></div><Switch.Root checked={comfort.simple} onCheckedChange={simple => set({ simple })} aria-label="Simple mode" className="relative h-8 w-14 shrink-0 rounded-full border-2 border-hairline-strong bg-none-bg data-[state=checked]:bg-nile"><Switch.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-surface shadow-1 transition-transform data-[state=checked]:translate-x-6" /></Switch.Root></div>

          <button type="button" onClick={() => set(ROLE_DEFAULTS[(document.body.dataset.role || 'SECRETARIAT')] ?? ROLE_DEFAULTS.SECRETARIAT)} className="mt-8 min-h-hit w-full rounded-m border-2 border-nile px-4 font-semibold text-nile hover:bg-nile-tint">Reset to recommended</button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
