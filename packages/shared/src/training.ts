export const TRAINING_NAME_MAX_LENGTH = 120;
export const TRAINING_ABOUT_MAX_LENGTH = 500;
export const TRAINING_URL_MAX_LENGTH = 500;
export const TRAINING_PAGE_SIZE = 25;

/** A training taken each year lapses after this many days. */
export const TRAINING_RENEWAL_DAYS = 365;
/** A training is due this long after a person joined, or after it was added if that is later. */
export const TRAINING_DUE_DAYS = 30;
/** A training that lapses is shown as due again this long before it does. */
export const TRAINING_RENEWAL_WARNING_DAYS = 30;

/** To do (never taken, or lapsed), done, or done but due again soon. */
export const TRAINING_STATUSES = ['todo', 'done', 'renew'] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

/** The trainings suggested to a company that has none. They say what is taught; the company links its own material. */
export const TRAINING_STARTERS = [
  {
    name: 'DPDP Act awareness',
    about:
      'What the Act is, who it protects, and what it asks of everyone who handles personal data.',
  },
  {
    name: 'Handling personal data',
    about:
      'Collecting, using, sharing and deleting personal data safely, and only for the purpose it was given for.',
  },
  {
    name: 'Spotting and reporting a breach',
    about: 'What counts as a personal data breach, who to tell, and how fast.',
  },
  {
    name: 'Handling a data request',
    about:
      'What to do when someone asks to see, correct or erase their data, or wants to complain.',
  },
] as const;

/** A training the company asks everyone to take. `done` is how many people have taken it. */
export interface TrainingResponse {
  id: string;
  name: string;
  about: string | null;
  /** The company's own video or document. */
  url: string | null;
  /** Taken again each year. */
  repeatsYearly: boolean;
  archivedAt: string | null;
  done: number;
}

export interface TrainingListResponse {
  trainings: TrainingResponse[];
  /** The people who have not left, who are asked to take each training. */
  people: number;
}

/** One training as the signed-in person sees it. */
export interface MyTrainingItem {
  id: string;
  name: string;
  about: string | null;
  url: string | null;
  /** The day it was completed, or null while it is still to do. */
  completedOn: string | null;
  repeatsYearly: boolean;
  status: TrainingStatus;
  /** The day a yearly training lapses, once it has been taken. */
  expiresOn: string | null;
  /** The day it is due, while it is to do or due again. */
  dueOn: string | null;
}

export interface MyTrainingResponse {
  items: MyTrainingItem[];
  /** The day the last one was completed, once every training is done. */
  completeOn: string | null;
}

/** One person's progress through the trainings. */
export interface TeamTrainingRow {
  personId: string;
  name: string;
  email: string;
  /** Trainings taken and still current. */
  done: number;
  total: number;
  completeOn: string | null;
}

export interface TeamTrainingResponse {
  people: TeamTrainingRow[];
  total: number;
  page: number;
  pageSize: number;
  /** How many trainings there are, and how many people have done all of them. */
  trainings: number;
  trained: number;
  everyone: number;
}

export interface AddTrainingRequest {
  name: string;
  about?: string;
  url?: string;
  repeatsYearly?: boolean;
}

export interface UpdateTrainingRequest {
  name?: string;
  about?: string | null;
  url?: string | null;
  repeatsYearly?: boolean;
}

/** An admin can record a completion for someone else by naming them. */
export interface CompleteTrainingRequest {
  personId?: string;
}
