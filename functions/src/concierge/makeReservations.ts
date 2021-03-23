import * as functions from 'firebase-functions';
import { db } from '../_firebaseHelper';
import { Component } from '../_models';
import { getAllComponents } from '../_statuspageHelper';

export const makeReservations = functions.https.onRequest(async (request, response) => {
  // verify parameters
  if(request.query.pageId && typeof(request.query.pageId) === 'string') {
    // get components in statuspage.io
    let components = await getAllComponents(request.query.pageId);

    // sync StatusPage.io -> Firestore
    for(let item of components) {
      // if this is an actual component and not a "group"
      if(! item.group) {
        // check what we have on it
        let query = await db
        .collection('components')
        .where('pageId', '==', request.query.pageId)
        .where('componentId', '==', `${item.id}`)
        .get();

        // if don't have it, add it
        if(query.empty) {
          const data: Component = {
            displayName: item.name,
            pageId: item.page_id,
            componentId: item.id,
            status: item.status,
            incident_id: null,
            lastCheckIn: new Date()
          };
          await db.collection('components').add(data);
        }
        else {
          // if we already have it, make sure our copy of the data is up to date
          const data: Partial<Component> = {
            displayName: item.name
          };
          await query.docs[0].ref.update(data);
        }
      }
    }

    // delete Firestore entries that don't exist in StatusPage.io
    const docs = await db.collection('components').listDocuments();
    for(let doc of docs) {
      const snap = await doc.get();
      const data: Component = snap.data() as Component;
      // check if the Firestore component was missing from the results
      if(components.findIndex(e => e.id === data.componentId) === -1) {
        // if missing from the results, we don't want to keep old data
        await doc.delete();
      }
    }

    response.sendStatus(200);
  }
  else {
    // didnt specify a thing
    response.sendStatus(400);
  }
});