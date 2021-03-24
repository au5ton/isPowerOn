import * as functions from 'firebase-functions';
import { db, firestore } from '../_firebaseHelper';
import { postIncident, SPIncident, updateIncident } from '../_statuspageHelper';
import { Component } from '../_models';

export const housekeeping = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
  await _housekeeping();
});

export const housekeepingManual = functions.https.onRequest(async (request, response) => {
  await _housekeeping();

  response.sendStatus(200);
});

async function _housekeeping() {
  const components = await db.collection('components').listDocuments();

  for(let doc of components) {
    const snap = await doc.get();
    const data: Component = snap.data() as Component;
    console.log(data)

    // if we've heard from this component within the last 30 minutes,
    if(timeWithinRangeOf(new Date(), data.lastCheckIn, minutes(30))) {
      // they're "operational"
      if(data.status !== 'operational') {
        // Tell our database what's happening
        const fbUpdate: Partial<Component> = {
          status: 'operational',
          incidentId: null
        };
        await snap.ref.update(fbUpdate);

        // Update the StatusPage incident
        if(data.incidentId) {
          const spUpdate: Partial<SPIncident> = {
            status: 'resolved',
            components: {}
          };
          spUpdate.components![data.componentId] = 'operational';
          await updateIncident(data.pageId, data.incidentId, spUpdate);
        }
      }
    }
    else {
      // otherwise, they're considered "major_outage"
      if(data.status !== 'major_outage') {
        // Tell our database what's happening
        const fbUpdate: Partial<Component> = {
          status: 'major_outage'
        };
        await snap.ref.update(fbUpdate);

        // Compose the StatusPage incident
        const thirty_minutes_ago = new Date(new Date().valueOf() - minutes(30));
        const last_check_in = data.lastCheckIn instanceof Date ? data.lastCheckIn : data.lastCheckIn.toDate();

        const spUpdate: Partial<SPIncident> = {
          name: `${data.displayName} - Offline`,
          status: 'investigating',
          impact_override: 'major',
          body: `<em>${data.displayName}</em> missed the check-in interval. It was last heard from at ${last_check_in.toUTCString()}. It was expected to check in at or after ${thirty_minutes_ago.toUTCString()}.`,
          components: {}
        };
        spUpdate.components![data.componentId] = 'major_outage';

        // Submit and save the incident
        const incident = await postIncident(data.pageId, spUpdate);

        // Save to our database the incident ID
        fbUpdate.incidentId = incident.id;
        await snap.ref.update(fbUpdate);
      }
    }
  }
}

function minutes(minutes: number) {
  return minutes * 60000;
}

function timeWithinRangeOf(a: Date | firestore.Timestamp, b: Date | firestore.Timestamp, deltaMillis: number) {
  let aMillis = a instanceof Date ? a.valueOf() : a.toMillis();
  let bMillis = b instanceof Date ? b.valueOf() : b.toMillis();
  return Math.abs(aMillis - bMillis) < deltaMillis;
}
