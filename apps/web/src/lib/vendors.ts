import type {
  AddVendorRequest,
  UpdateVendorRequest,
  VendorCategory,
  VendorDataKind,
  VendorLocation,
  VendorResponse,
  VendorStatus,
  VendorTreatment,
} from '@dpdp-kit/shared';

/** The parts of a vendor that are filled in one at a time, each in its own small form. */
export const VENDOR_SECTIONS = ['details', 'data', 'review'] as const;

export type VendorSection = (typeof VENDOR_SECTIONS)[number];

/** What a vendor form holds while it is being filled in. Empty text means nothing was written. */
export interface VendorValues {
  name: string;
  website: string;
  service: string;
  category: VendorCategory;
  ownerId: string | null;
  status: VendorStatus;
  dataKinds: VendorDataKind[];
  location: VendorLocation | null;
  agreementUrl: string;
  nextReviewOn: string | null;
}

export const NEW_VENDOR: VendorValues = {
  name: '',
  website: '',
  service: '',
  category: 'other',
  ownerId: null,
  status: 'not_assessed',
  dataKinds: [],
  location: null,
  agreementUrl: '',
  nextReviewOn: null,
};

export function toValues(vendor: VendorResponse): VendorValues {
  return {
    name: vendor.name,
    website: vendor.website ?? '',
    service: vendor.service,
    category: vendor.category,
    ownerId: vendor.owner?.id ?? null,
    status: vendor.status,
    dataKinds: vendor.dataKinds,
    location: vendor.location,
    agreementUrl: vendor.agreementUrl ?? '',
    nextReviewOn: vendor.nextReviewOn,
  };
}

/** Only the details need anything: a vendor has a name and says what it does. Every other part may be left empty. */
export const canSaveVendor = (section: VendorSection, values: VendorValues): boolean =>
  section !== 'details' || (values.name.trim() !== '' && values.service.trim() !== '');

/** What is sent to add a vendor: who it is and what it does. The rest is filled in on its page. */
export function toAddRequest(values: VendorValues): AddVendorRequest {
  return {
    name: values.name.trim(),
    website: values.website.trim() || undefined,
    service: values.service.trim(),
    category: values.category,
    ownerId: values.ownerId ?? undefined,
  };
}

/** What is sent to change one part of a vendor. What was emptied is sent as null, so it is cleared. */
export function toUpdateRequest(section: VendorSection, values: VendorValues): UpdateVendorRequest {
  switch (section) {
    case 'details':
      return {
        ...toAddRequest(values),
        website: values.website.trim() || null,
        ownerId: values.ownerId,
        status: values.status,
      };
    case 'data':
      return { dataKinds: values.dataKinds, location: values.location };
    case 'review':
      return {
        agreementUrl: values.agreementUrl.trim() || null,
        nextReviewOn: values.nextReviewOn,
      };
  }
}

/** What the treatment card holds while it is being filled in. */
export interface TreatmentValues {
  treatment: VendorTreatment | null;
  note: string;
}

export const toTreatmentValues = (vendor: VendorResponse): TreatmentValues => ({
  treatment: vendor.treatment,
  note: vendor.treatmentNote ?? '',
});

/** Whether anything differs from what is saved, so Save is only offered when there is something to save. */
export const treatmentChanged = (vendor: VendorResponse, values: TreatmentValues): boolean =>
  values.treatment !== vendor.treatment || values.note.trim() !== (vendor.treatmentNote ?? '');

/** What is sent to save the decision. An empty reason is sent as null, so it is cleared. */
export const toTreatmentRequest = (values: TreatmentValues): UpdateVendorRequest => ({
  treatment: values.treatment,
  treatmentNote: values.note.trim() || null,
});
