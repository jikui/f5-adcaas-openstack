/**
 * Copyright 2019 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {model, property} from '@loopback/repository';
import {CommonEntity} from './common.model';

@model()
export class Monitor extends CommonEntity {
  @property({
    type: 'number',
    default: 5,
    schema: {
      create: true,
      update: true,
      response: true,
      example: 5,
    },
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  interval: number;

  @property({
    type: 'number',
    default: 16,
    schema: {
      create: true,
      update: true,
      response: true,
      example: 16,
    },
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  timeout: number;

  @property({
    type: 'string',
    default: '',
    schema: {
      create: true,
      update: true,
      response: true,
      example: '192.168.10.123',
    },
    openapi: {
      format: 'ipv4',
    },
  })
  targetAddress: string;

  @property({
    type: 'number',
    default: 0,
    schema: {
      create: true,
      update: true,
      response: true,
      example: 8080,
    },
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  targetPort: number;

  @property({
    type: 'string',
    required: true,
    default: 'tcp',
    schema: {
      create: true,
      update: true,
      response: true,
      example: 'tcp',
    },
    as3: {},
    openapi: {
      enum: ['tcp', 'udp', 'ping'],
    },
  })
  monitorType: string;

  // user can specify the below attributes to create a certain type monitor
  // TODO: separate the monitors to more specific monitor in future

  @property({
    type: 'string',
    default: 'no-error',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  acceptRCODE: string;

  @property({
    type: 'boolean',
    default: false,
  })
  adaptive: boolean;

  @property({
    type: 'number',
    default: 500,
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  adaptiveDivergenceMilliseconds: number;

  @property({
    type: 'number',
    default: 100,
    openapi: {
      type: 'integer',
      minimal: '0',
      maxmium: '100',
    },
  })
  adaptiveDivergencePercentage: number;

  @property({
    type: 'string',
    default: 'relative',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  adaptiveDivergenceType: string;

  @property({
    type: 'number',
    default: 1000,
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  adaptiveLimitMilliseconds: number;

  @property({
    type: 'number',
    default: 180,
    openapi: {
      type: 'integer',
      minimal: '1',
      maxmium: '65535',
    },
  })
  adaptiveWindow: number;

  @property({
    type: 'string',
    default: 'query-type',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  answerContains: string;

  @property({
    type: 'string',
    default: '',
  })
  arguments: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  base: string;

  @property({
    type: 'boolean',
    default: true,
  })
  chaseReferrals: boolean;

  @property({
    type: 'string',
    default: '',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  ciphers: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  clientCertificate: string;

  @property({
    type: 'array',
    itemType: 'number',
  })
  codesDown: number[];

  @property({
    type: 'array',
    itemType: 'number',
  })
  codesUp: number[];

  @property({
    type: 'string',
    default: '',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  domain: string;

  @property({
    type: 'number',
    default: 0,
    openapi: {
      type: 'integer',
      minimal: '0',
      maxmium: '65535',
    },
  })
  dscp: number;

  @property({
    type: 'boolean',
    default: true,
  })
  expand: boolean;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  filter: string;

  @property({
    type: 'string',
    default: '',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  headers: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  label: string;

  @property({
    type: 'boolean',
    default: false,
  })
  mandatoryAttributes: boolean;

  @property({
    type: 'string',
    openapi: {
      format: 'ipv4',
    },
  })
  nasIpAddress: string;

  @property({
    type: 'object',
  })
  passphrase: object;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  pathname: string;

  @property({
    type: 'string',
    default: 'udp',
    openapi: {
      enum: ['udp', 'tcp', 'http', 'https'],
    },
  })
  protocol: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  queryName: string;

  @property({
    type: 'string',
    default: 'a',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  queryType: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  receive: string;

  @property({
    type: 'string',
    default: '',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  receiveDown: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  remark: string;

  @property({
    type: 'string',
    default: '',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 0,
          maxLength: 100,
        },
      },
    },
  })
  request: string;

  @property({
    type: 'boolean',
    default: false,
  })
  reverse: boolean;

  @property({
    type: 'object',
  })
  script: object;

  @property({
    type: 'object',
  })
  secret: object;

  @property({
    type: 'string',
    default: 'none',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  security: string;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  send: string;

  @property({
    type: 'number',
    default: 0,
    openapi: {
      type: 'integer',
      minimal: '0',
      maxmium: '65535',
    },
  })
  timeUntilUp: number;

  @property({
    type: 'boolean',
    default: false,
  })
  transparent: boolean;

  @property({
    type: 'number',
    default: 0,
    openapi: {
      type: 'integer',
      minimal: '0',
      maxmium: '65535',
    },
  })
  upInterval: number;

  @property({
    type: 'string',
    openapi: {
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  })
  username: string;

  constructor(data?: Partial<Monitor>) {
    super(data);
    this.as3Class = 'Monitor';
  }
}
