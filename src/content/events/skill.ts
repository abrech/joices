import type { EventDef, SkillPickPayload } from '../../types/events';
import {
  buildTrainingPayload,
  canAppearTraining,
  skillTrainingEventMeta,
} from '../../game/events/trainingEvent';

export { hasTrainingAvailable } from '../../game/events/trainingEvent';

export const skillTrainingEvent: EventDef = {
  ...skillTrainingEventMeta,
  canAppear: canAppearTraining,
  buildPayload: buildTrainingPayload,
  buildOfferPreview: (_ctx, payload) => {
    const p = payload as SkillPickPayload;
    return p.skills.length > 0 ? 'New attacks, passives, and upgrades available' : 'No training available';
  },
};
