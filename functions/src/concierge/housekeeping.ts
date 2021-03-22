import * as functions from 'firebase-functions';
import { db, firestore } from '../_firebaseHelper';
import { updateComponent } from '../_statuspageHelper';
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
        const update: Partial<Component> = {
          status: 'operational'
        };
        await snap.ref.update(update);
        await updateComponent(data.pageId, data.componentId, {
          status: 'operational'
        });
      }
    }
    else {
      // otherwise, they're considered "major_outage"
      if(data.status !== 'major_outage') {
        const update: Partial<Component> = {
          status: 'major_outage'
        };
        await snap.ref.update(update);
        await updateComponent(data.pageId, data.componentId, {
          status: 'major_outage'
        });
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
