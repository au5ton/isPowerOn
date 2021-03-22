import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const HOST: string = 'https://api.statuspage.io/v1';
export const KEY: string = functions.config().statuspage?.key || '';

export type SPComponentStatus = 'operational' | 'under_maintenance' | 'degraded_performance' | 'partial_outage' | 'major_outage' | '';

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