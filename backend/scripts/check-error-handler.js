import { errorHandler } from '../src/middleware/errorHandler.js';

const res = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    console.log(JSON.stringify({ statusCode: this.statusCode, body: payload }));
    return this;
  },
};

errorHandler({ code: 'ECONNREFUSED' }, {}, res, () => {});
