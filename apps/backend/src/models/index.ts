import { User } from './User';
import { Pad } from './Pad';
import { PadSession } from './PadSession';

User.hasMany(Pad, {
  foreignKey: 'user_id',
  as: 'pads',
});

Pad.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Pad.hasMany(PadSession, {
  foreignKey: 'pad_id',
  as: 'sessions',
});

PadSession.belongsTo(Pad, {
  foreignKey: 'pad_id',
  as: 'pad',
});

export { User, Pad, PadSession };