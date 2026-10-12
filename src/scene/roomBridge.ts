import type { SetupKind } from './DeskSetup'

// The room lives inside its own <Canvas>; the speech bubbles are HTML above it.
// The room registers these functions so the bubbles can ask it things without React state per frame.
export const roomBridge = {
  // which part (person / plant) is under a screen point, if any
  pick: null as null | ((clientX: number, clientY: number) => SetupKind | null),
  // screen position (px) of a bubble's anchor; raised = the plant's bubble moved up while watering
  project: null as null | ((kind: SetupKind, raised: boolean) => { x: number; y: number }),
  // start the 4.4 s watering animation; onDone runs when the can is gone and the plant has grown
  water: null as null | ((onDone: () => void) => void),
}
