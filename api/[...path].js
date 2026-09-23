import { app } from '../src/app.js';

export default async function handler(request, response) {
  return app(request, response);
}
