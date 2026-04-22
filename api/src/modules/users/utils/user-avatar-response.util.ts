import { UserAvatarStorageService } from '../services/user-avatar-storage.service';

export function buildAvatarUrl(
  avatarKey: string | null | undefined,
  storage: UserAvatarStorageService,
) {
  return avatarKey ? storage.getPublicUrl(avatarKey) : null;
}

export function buildAvatarValue(
  avatarSeed: string | null | undefined,
  avatarKey: string | null | undefined,
  storage: UserAvatarStorageService,
) {
  return avatarKey ? storage.getPublicUrl(avatarKey) : avatarSeed ?? null;
}
