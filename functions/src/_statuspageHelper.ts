import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const HOST: string = 'https://api.statuspage.io/v1';
export const KEY: string = functions.config().statuspage?.key || '';

export type SPComponentStatus = 'operational' | 'under_maintenance' | 'degraded_performance' | 'partial_outage' | 'major_outage' | '';
export type SPIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled' | 'in_progress' | 'verifying' | 'completed';

export interface SPComponent {
  id: string;
  page_id: string;
  group_id: string;
  created_at: string; // '2021-03-22T19:49:18Z'
  updated_at: string; // '2021-03-22T19:49:18Z's
  group: boolean;
  name: string;
  description: string;
  position: number;
  status: SPComponentStatus;
  showcase: boolean;
  only_show_if_degraded: boolean;
  automation_email: string;
  start_date: string; // '2021-03-22'
}

export interface SPIncident {
  id: string;
  name: string;
  status: SPIncidentStatus;
  impact_override: 'maintenance' | 'none' | 'critical' | 'major' | 'minor';
  scheduled_for: string;
  scheduled_until: string;
  scheduled_remind_prior: boolean;
  scheduled_auto_in_progress: boolean;
  scheduled_auto_completed: true,
  metadata: object;
  deliver_notifications: boolean;
  auto_transition_deliver_notifications_at_end: boolean;
  auto_transition_deliver_notifications_at_start: boolean;
  auto_transition_to_maintenance_state: boolean;
  auto_transition_to_operational_state: boolean;
  auto_tweet_at_beginning: boolean;
  auto_tweet_on_completion: boolean;
  auto_tweet_on_creation: boolean;
  auto_tweet_one_hour_before: boolean;
  backfill_date: string;
  backfilled: boolean;
  body: string;
  components: { 
    [ component_id: string]: SPComponentStatus 
  };
  component_ids: string[];
  scheduled_auto_transition: boolean;
}

export async function getAllComponents(pageId: string): Promise<SPComponent[]> {
  const res = await fetch(`${HOST}/pages/${pageId}/components`, {
    headers: {
      'Authorization': `OAuth ${KEY}`
    }
  });
  return await res.json() as SPComponent[];
}

export async function getComponent(pageId: string, componentId: string): Promise<SPComponent> {
  const res = await fetch(`${HOST}/pages/${pageId}/components/${componentId}`, {
    headers: {
      'Authorization': `OAuth ${KEY}`
    }
  });
  return await res.json() as SPComponent;
}

export async function updateComponent(pageId: string, componentId: string, body: Partial<SPComponent>): Promise<SPComponent> {
  const res = await fetch(`${HOST}/pages/${pageId}/components/${componentId}`, {
    method: 'PATCH',
    body: JSON.stringify({'component': body}),
    headers: {
      'Authorization': `OAuth ${KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return await res.json() as SPComponent;
}

export async function postIncident(pageId: string, body: Partial<SPIncident>): Promise<SPIncident> {
  const res = await fetch(`${HOST}/pages/${pageId}/incidents`, {
    method: 'POST',
    body: JSON.stringify({'incident': body}),
    headers: {
      'Authorization': `OAuth ${KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return await res.json() as SPIncident;
}

export async function updateIncident(pageId: string, incidentId: string, body: Partial<SPIncident>): Promise<SPIncident> {
  const res = await fetch(`${HOST}/pages/${pageId}/incidents/${incidentId}`, {
    method: 'PATCH',
    body: JSON.stringify({'incident': body}),
    headers: {
      'Authorization': `OAuth ${KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return await res.json() as SPIncident;
}