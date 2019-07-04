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

import { Provider, inject } from '@loopback/core';
import { BIGIPDataSource } from '../datasources/bigip.datasource';
import { getService } from '@loopback/service-proxy';
import { factory } from '../log4ts';
import { probe } from 'network-utils-tcp-ping';
import { checkAndWait } from '../utils';

export const BigipBuiltInProperties = {
  admin: 'admin',
  port: 443,
};

export interface BigipService {
  getInfo(
    url: string,
    cred64en: string,
  ): Promise<object>;
  uploadDO(
    url: string,
    cred64en: string,
    end: number,
    length: number,
    body: object,
  ): Promise<object>;
  installDO(
    url: string,
    cred64en: string,
    body: object,
  ): Promise<object>;
}

export class BigipServiceProvider implements Provider<BigipService> {
  constructor(
    @inject('datasources.bigip')
    protected dataSource: BIGIPDataSource = new BIGIPDataSource(),
  ) { }

  value(): Promise<BigipService> {
    return getService(this.dataSource);
  }
}

export class BigIpManager {
  private bigipService: BigipService;
  private baseUrl: string;
  private cred64Encoded: string;
  private logger = factory.getLogger('services.BigIpManager');

  constructor(private config: BigipConfig) {
    this.baseUrl = `https://${this.config.ipAddr}:${this.config.port}`;
    this.cred64Encoded =
      'Basic ' +
      Buffer.from(`${this.config.username}:${this.config.password}`).toString(
        'base64',
      );
  }

  static async instanlize(config: BigipConfig): Promise<BigIpManager> {
    let bigIpMgr = new BigIpManager(config);
    bigIpMgr.bigipService = await new BigipServiceProvider().value();
    return bigIpMgr;
  }

  async getSys(): Promise<object> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/sys`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    return JSON.parse(JSON.stringify(response))['body'][0];
  }

  async getInterfaces(): Promise<BigipInterfaces> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/net/interface`;

    let impFunc = async () => {
      let response = await this.bigipService.getInfo(url, this.cred64Encoded);
      let resObj = JSON.parse(JSON.stringify(response))['body'][0];
      this.logger.debug(`get ${url} resposes: ${JSON.stringify(resObj)}`);
      return resObj;
    };

    let checkFunc = async () => {
      return await impFunc().then(resObj => {
        let items = resObj['items'];
        for (let intf of items) {
          if (intf.macAddress === 'none') {
            this.logger.warn("bigip interface's mac addr is 'none', waiting..");
            return false;
          }
        }
        this.logger.debug('bigip mac addresses are ready to get.');
        return true;
      });
    };

    // The interface mac addresses are 'none' at the very beginning of the bigip readiness.
    return await checkAndWait(checkFunc, 60).then(
      async () => {
        return await impFunc().then(resObj => {
          let items = resObj['items'];
          let interfaces: BigipInterfaces = {};
          for (let intf of items) {
            let macAddr = intf.macAddress;
            interfaces[macAddr] = {
              name: intf.name,
              macAddress: macAddr,
            };
          }
          return interfaces;
        });
      },
      () => {
        throw new Error('bigip mac addresses are not ready to get.');
      },
    );
  }

  async getLicense(): Promise<BigipLicense> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/sys/license`;

    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    let resObj = JSON.parse(JSON.stringify(response))['body'][0];
    this.logger.debug(`get ${url} resposes: ${JSON.stringify(resObj)}`);

    if (resObj.entries) {
      for (let entry of Object.keys(resObj.entries)) {
        if (!entry.endsWith('/mgmt/tm/sys/license/0')) continue;

        return {
          registrationKey:
            resObj.entries[entry].nestedStats.entries.registrationKey
              .description,
        };
      }
    } else if (resObj.apiRawValues) {
      return {
        registrationKey: 'none',
      };
    }

    throw new Error(`License not found: from ${resObj}`);
  }

  async getConfigsyncIp(): Promise<string> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/cm/device`;

    let impFunc = async () => {
      let response = await this.bigipService.getInfo(url, this.cred64Encoded);
      let resObj = JSON.parse(JSON.stringify(response))['body'][0];
      this.logger.debug(`get ${url} resposes: ${JSON.stringify(resObj)}`);
      return resObj;
    };

    let checkFunc = async () => {
      return await impFunc().then(resObj => {
        let items = resObj['items'];
        for (let item of items) {
          if (
            item.managementIp === this.config.ipAddr &&
            item.configsyncIp !== 'none'
          ) {
            return true;
          } else {
            this.logger.warn('No configsync IP, waiting...');
            return false;
          }
        }
        this.logger.debug('Configsync IP is ready.');
        return true;
      });
    };

    return await checkAndWait(checkFunc, 60).then(
      async () => {
        return await impFunc().then(resObj => {
          let items = resObj['items'];
          let ip = '';
          for (let item of items) {
            if (item.managementIp === this.config.ipAddr) {
              ip = item.configsyncIp;
            }
          }
          return ip;
        });
      },
      () => {
        throw new Error('No configsync IP');
      },
    );
  }

  async getPartition(partition: string): Promise<string> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/sys/folder/~${partition}`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    let resObj = JSON.stringify(response);
    return resObj;
  }

  async getDOStatus(): Promise<string> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/shared/declarative-onboarding/info`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    let resObj = JSON.stringify(response);
    return resObj;
  }

  async uploadDO(): Promise<string> {
    // if the local file doesn't exist, throw execption.
    //read the file's contant into a buf and calculate its length
    //call the bigipService.uploadDO to upload the RPM to Bigip
    //possibly check  if the upload succeeds or not
    //await this.mustBeReachable();
    let url = `${this.baseUrl}/mgmt/shared/file-transfer/uploads/F5_DO_RPM_PACKAGE.rpm`;
    let fs = require('fs');
    let buffer = fs.readFileSync("/var/tmp/DO/f5-declarative-onboarding-1.5.0-11.noarch.rpm","binary");
    let response = await this.bigipService.uploadDO(url, this.cred64Encoded,
      1536120, 1536121, buffer);
    let resObj = JSON.stringify(response);
    return resObj;
  }
  async installDO(): Promise<string> {
    // create the body with following format.
    await this.mustBeReachable();
    let body = {
      "operation": "INSTALL",
      "packageFilePath": "/var/config/rest/downloads/F5_DO_RPM_PACKAGE.rpm"
    };
    // call the bigipService.installDO to install the RPM
    //possibly check if the install succeeds or not.
    let url = `${this.baseUrl}mgmt/shared/iapp/package-management-tasks`;
    let response = await this.bigipService.installDO(url,this.cred64Encoded,body)
    let resObj = JSON.stringify(response);
    return resObj;

  }
  async getAS3Info(): Promise<object> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/shared/appsvcs/info`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    return JSON.parse(JSON.stringify(response))['body'][0];
  }

  async getHostname(): Promise<string> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/sys/global-settings`;

    let response = await this.bigipService.getInfo(url, this.cred64Encoded);

    let resObj = JSON.parse(JSON.stringify(response));
    this.logger.debug(
      `get ${url} resposes: ${JSON.stringify(resObj['body'][0])}`,
    );

    return resObj['body'][0]['hostname'];
  }

  async getVlans(): Promise<BigipVlans> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/net/vlan`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    let resObj = JSON.parse(JSON.stringify(response))['body'][0];
    this.logger.debug(`get ${url} resposes: ${JSON.stringify(resObj)}`);

    let vlans: BigipVlans = {};
    for (let vlan of resObj.items) {
      let name = vlan.name;
      vlans[name] = {
        tag: vlan.tag,
      };
    }
    return vlans;
  }

  async getSelfips(): Promise<BigipSelfips> {
    await this.mustBeReachable();

    let url = `${this.baseUrl}/mgmt/tm/net/self`;
    let response = await this.bigipService.getInfo(url, this.cred64Encoded);
    let resObj = JSON.parse(JSON.stringify(response))['body'][0];
    this.logger.debug(`get ${url} resposes: ${JSON.stringify(resObj)}`);

    let selfips: BigipSelfips = {};
    for (let self of resObj.items) {
      let name = self.name;
      selfips[name] = {
        address: self.address,
      };
    }
    return selfips;
  }

  private async reachable(): Promise<boolean> {
    return await probe(
      this.config.port,
      this.config.ipAddr,
      this.config.timeout,
    );
  }

  private async mustBeReachable(): Promise<void> {
    if (!(await this.reachable()))
      throw new Error(
        'Host unreachable: ' +
        JSON.stringify({
          ipaddr: this.config.ipAddr,
          port: this.config.port,
        }),
      );
  }
}

type BigipConfig = {
  username: string;
  password: string;
  ipAddr: string;
  port: number;
  timeout?: number;
};

type BigipInterfaces = {
  [key: string]: {
    macAddress: string;
    name: string;
  };
};

type BigipLicense = {
  registrationKey: string;
};

type BigipVlans = {
  [key: string]: {
    tag: number;
  };
};

type BigipSelfips = {
  [key: string]: {
    address: string;
  };
};
