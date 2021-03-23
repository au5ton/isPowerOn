import { firestore } from './_firebaseHelper';
import { SPComponentStatus } from './_statuspageHelper';

export interface Component {
  displayName: string;
  componentId: string;
  pageId: string;
  incident_id: string | null;
  lastCheckIn: Date | firestore.Timestamp;
  status: SPComponentStatus;
}