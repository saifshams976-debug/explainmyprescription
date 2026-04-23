export interface Medication {
  name: string;
  overview: string;
  whyPrescribed: string;
  howToTake: {
    timing: string;
    withFood: string;
    tips: string[];
  };
  sideEffects: string[];
  warnings: string[];
  missedDose: string;
  lifestyle: {
    alcohol: string;
    driving: string;
    food: string;
  };
  timeline: {
    startsWorking: string;
    sideEffectsAppear: string;
  };
}

export interface ExplanationResponse {
  medications: Medication[];
}
