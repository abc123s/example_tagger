import axios from 'axios';
import _ from 'lodash';

import { KIND } from './Constants';

const SERVER_ROOT = '/api/';

const endpointMap = {
  [KIND.trainingExample]: {
    get: data => ({
      method: 'GET',
      endpoint: `trainingExample/${data.id}`,
      desc: `Get training example ${data.id}`,
    }),

    tag: data => ({
      method: 'POST',
      endpoint: `trainingExample/tag/${data.id}`,
      desc: `Setting tags ${data.tags} for training example ${data.id}`,
    }),

    match: data => ({
      method: 'POST',
      endpoint: `trainingExample/match/${data.id}`,
      desc: `Setting ingredients ${data.tags} for training example ${data.id}`,
    }),

    escalate: data => ({
      method: 'POST',
      endpoint: `trainingExample/escalate/${data.id}`,
      desc: `Escalating training example ${data.id} (for tagging)`,
    }),

    escalateMatch: data => ({
      method: 'POST',
      endpoint: `trainingExample/escalateMatch/${data.id}`,
      desc: `Escalating training example ${data.id} (for matching)`,
    }),

    next: data => ({
      method: 'GET',
      endpoint: `trainingExample/next/${data.id}`,
      desc: `Get next training example after ${data.id}`,
    }),

    nextUntagged: data => ({
      method: 'GET',
      endpoint: `trainingExample/nextUntagged/${data.id}`,
      desc: `Get next training example after ${data.id} that has not been tagged or escalated yet`,
    }),

    nextUnmatched: data => ({
      method: 'GET',
      endpoint: `trainingExample/nextUnMatched/${data.id}`,
      desc: `Get next training example after ${data.id} that has not been matched or escalated yet`,
    }),

    prev: data => ({
      method: 'GET',
      endpoint: `trainingExample/prev/${data.id}`,
      desc: `Get previous training example before ${data.id}`,
    }),
  },
};

/**
 * Returns endpoint and request object.
 */
function endpoints({ kind, data, type }) {
  // get endpoint details
  const e = endpointMap[kind][type](data);

  // construct request object
  const details = {
    url: SERVER_ROOT + e.endpoint,
    method: e.method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    desc: e.desc,
  };
  if (
    e.method === 'POST' ||
    e.method === 'PUT' ||
    (e.method === 'DELETE' && _.keys(data).length > 1)
  ) {
    details.data = JSON.stringify(data);
  }
  return details;
}

/**
 * Hit the server.
 * ``request`` is an object containing kind, type, data
 * ``flash`` is a function to update flash message
 * ``errorOnly`` is a bool to flash only on error
 */
export default function callEndpoint(request, flash, errorOnly) {
  // get the full request
  const details = endpoints(request);

  // construct flash functions
  const flashFunctions = flash
    ? {
        error: error => flash(error),
        success:
          !errorOnly && (details.data || details.method === 'DELETE')
            ? response =>
                flash({
                  status: response.status,
                  body: details.desc
                    ? `${details.desc} successful`
                    : response.data,
                })
            : null,
      }
    : {};

  // call the endpoint
  return axios(details)
    .then(response => {
      if (flashFunctions.success) {
        flashFunctions.success(response);
      }
      return response.data;
    })
    .catch(error => {
      // request made, status outside 2XX
      if (error.response) {
        if (flashFunctions.error) {
          if (_.get(error, ['response', 'data', 'internalCode'])) {
            flashFunctions.error({
              status: error.response.data.internalCode,
              body: error.response.data.message,
            });
          } else {
            flashFunctions.error({
              status: error.response.status,
              body: JSON.stringify(error.response.data),
            });
          }
        }
        return Promise.reject(
          new Error(
            `${error.response.status}: ${JSON.stringify(error.response.data)}`
          )
        );

        // request made but no response received
      } else if (error.request) {
        if (flashFunctions.error) {
          flashFunctions.error({
            status: 400,
            body: 'Could not connect with server',
          });
        }
        return Promise.reject(new Error('Could not connect with server'));
      }
      // request setup broke somehow
      if (flashFunctions.error) {
        flashFunctions.error({ status: 400, body: error.message });
      }
      return Promise.reject(new Error(error.message));
    });
}
