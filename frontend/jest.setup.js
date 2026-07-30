import { TextDecoder, TextEncoder } from 'node:util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

import '@testing-library/jest-dom';
