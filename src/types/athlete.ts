export type NumericDatabaseValue = number | string;

export type AthleteProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: NumericDatabaseValue | null;
  primary_sport: string | null;
  training_history: string | null;
  weekly_volume: string | null;
};

export type PowerProfile = {
  id?: string;
  user_id: string;
  one_minute_watts: NumericDatabaseValue;
  five_minute_watts: NumericDatabaseValue;
  twelve_minute_watts: NumericDatabaseValue;
  maximal_efforts_confirmed: boolean;
  recorded_at: string | null;
};

export type AthleteData = {
  profile: AthleteProfile;
  powerProfile: PowerProfile | null;
};
