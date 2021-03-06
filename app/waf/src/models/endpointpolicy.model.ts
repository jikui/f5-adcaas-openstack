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

import {model, hasMany} from '@loopback/repository';
import {CommonEntity, AS3Declaration, Rule} from '.';

@model()
export class Endpointpolicy extends CommonEntity {
  @hasMany(() => Rule, {keyTo: 'endpointpolicyId'})
  rules: Rule[] = [];

  constructor(data?: Partial<Endpointpolicy>) {
    super(data);

    this.as3Class = 'Endpoint_Policy';
  }

  getAS3Declaration(): AS3Declaration {
    let obj = super.getAS3Declaration();

    obj.rules = this.rules.map(rule => rule.getAS3Declaration());

    return obj;
  }
}
