export type NearbyAlertZone = {
  id: string;
  reportId: string;
  distanceMeters: number;
  radiusMeters: number;
};

export type NearbyUser = {
  id: string;
  email: string;
  fullName: string;
};
