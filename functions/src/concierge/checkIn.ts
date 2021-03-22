import * as functions from 'firebase-functions';
import { db } from '../_firebaseHelper';
import { updateComponent } from '../_statuspageHelper';
import { Component } from '../_models';

export const checkIn = functions.https.onRequest(async (request, response) => {
  // verify parameters
  if(request.query.id && typeof(request.query.id) === 'string') {
    // create reference
    const docRef = db.collection('components').doc(request.query.id);
    const docSnap = await docRef.get();
    const docData = docSnap.data() as Component;
    
    // verify existence
    if(docSnap.exists) {
      // check in
      const updateData: Partial<Component> = {
        lastCheckIn: new Date()
      };

      // check if previous status was problematic
      if(docData.status !== 'operational') {
        updateData.status = 'operational';
      }

      await docRef.update(updateData);
      if(docData.status !== 'operational') {
        await updateComponent(docData.pageId, docData.componentId, {
          status: 'operational'
        });
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