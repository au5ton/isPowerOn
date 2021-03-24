import * as functions from 'firebase-functions';
import { db } from '../_firebaseHelper';
import { SPIncident, updateIncident } from '../_statuspageHelper';
import { Component } from '../_models';

export const checkIn = functions.https.onRequest(async (request, response) => {
  // verify parameters
  if(request.query.id && typeof(request.query.id) === 'string') {
    // create reference
    const doc = db.collection('components').doc(request.query.id);
    const snap = await doc.get();
    const data = snap.data() as Component;
    
    // verify existence
    if(snap.exists) {
      // check in
      const fbUpdate: Partial<Component> = {
        lastCheckIn: new Date()
      };
      await snap.ref.update(fbUpdate);

      // they're "operational"
      if(data.status !== 'operational') {
        // Tell our database what's happening
        fbUpdate.status = 'operational';
        fbUpdate.incidentId = null;
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
      
      response.sendStatus(200);
    }
    else {
      // this thing doesn't exist
      response.sendStatus(404);
    }
  }
  else {
    // didnt specify a thing
    response.sendStatus(400);
  }
});