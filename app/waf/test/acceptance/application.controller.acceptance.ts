// Copyright F5 Networks, Inc. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Client, expect, sinon, toJSON} from '@loopback/testlab';
import {WafApplication} from '../..';
import {ApplicationController} from '../../src/controllers';
import {
  setupApplication,
  teardownApplication,
  TestingApplication,
  setupRestAppAndClient,
  RestApplicationPort,
  teardownRestAppAndClient,
  setupEnvs,
  teardownEnvs,
} from '../helpers/test-helper';
import {
  givenEmptyDatabase,
  givenApplicationData,
  givenAdcData,
  createApplicationObject,
} from '../helpers/database.helpers';
import {
  ShouldResponseWith,
  MockKeyStoneController,
  ExpectedData,
} from '../fixtures/controllers/mocks/mock.openstack.controller';
import uuid = require('uuid');

describe('ApplicationController', () => {
  let wafapp: WafApplication;
  let controller: ApplicationController;
  let client: Client;
  let deployStub: sinon.SinonStub;
  let mockKeystoneApp: TestingApplication;

  const prefix = '/adcaas/v1';

  before('setupApplication', async () => {
    mockKeystoneApp = await (async () => {
      let {restApp} = await setupRestAppAndClient(
        RestApplicationPort.IdentityAdmin,
        MockKeyStoneController,
      );
      return restApp;
    })();

    ({wafapp, client} = await setupApplication());

    controller = await wafapp.get<ApplicationController>(
      'controllers.ApplicationController',
    );

    ShouldResponseWith({});
    setupEnvs();
  });

  beforeEach('Empty database', async () => {
    await givenEmptyDatabase(wafapp);
    deployStub = sinon.stub(controller.as3Service, 'deploy');
  });

  after(async () => {
    await teardownApplication(wafapp);
    teardownRestAppAndClient(mockKeystoneApp);
    teardownEnvs();
  });

  afterEach(async () => {
    deployStub.restore();
  });

  it('post ' + prefix + '/applications: with no id', async () => {
    const application = createApplicationObject({
      tenantId: ExpectedData.tenantId,
    });

    const response = await client
      .post(prefix + '/applications')
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .send(application)
      .expect(200);

    expect(response.body.application).to.containDeep(toJSON(application));
  });

  it('get ' + prefix + '/applications: of all', async () => {
    const application = await givenApplicationData(wafapp, {
      tenantId: ExpectedData.tenantId,
    });

    let response = await client
      .get(prefix + '/applications')
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect('Content-Type', /application\/json/);

    expect(response.body.applications[0]).to.containDeep(toJSON(application));
  });

  it('get ' + prefix + '/applications: with filter string', async () => {
    const application = await givenApplicationData(wafapp, {
      tenantId: ExpectedData.tenantId,
    });

    let response = await client
      .get(prefix + '/applications')
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .query({filter: {where: {id: application.id}}})
      .expect(200);

    expect(response.body.applications[0]).to.containDeep(toJSON(application));
  });

  it('get ' + prefix + '/applications/count', async () => {
    let response = await client
      .get(prefix + '/applications/count')
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect(200);
    expect(response.body.count).to.eql(0);

    const application = await givenApplicationData(wafapp);

    response = await client
      .get(prefix + '/applications/count')
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .query({where: {id: application.id}})
      .expect(200);
    expect(response.body.count).to.eql(1);
  });

  it('get ' + prefix + '/applications/{id}: selected item', async () => {
    await givenApplicationData(wafapp);
    const application = await givenApplicationData(wafapp);

    let response = await client
      .get(prefix + '/applications/' + application.id)
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect(200);

    expect(response.body.application).to.containDeep(toJSON(application));
  });

  it('get ' + prefix + '/applications/{id}: not found', async () => {
    await client
      .get(prefix + '/applications/' + uuid())
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect(404);
  });

  it('patch ' + prefix + '/applications/{id}: existing item', async () => {
    const patched_name = {name: 'new application name'};
    const application = await givenApplicationData(wafapp);

    await client
      .patch(prefix + '/applications/' + application.id)
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .send(patched_name)
      .expect(204, '');
  });

  it('patch ' + prefix + '/applications/{id}: non-existing item', async () => {
    const patched_name = {name: 'new application name'};
    await client
      .patch(prefix + '/applications/' + uuid())
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .send(patched_name)
      .expect(404);
  });

  it('delete ' + prefix + '/applications/{id}: non-existing item', async () => {
    await client
      .del(prefix + '/applications/' + uuid())
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect(404);
  });

  it('delete ' + prefix + '/applications/{id}: existing item', async () => {
    const application = await givenApplicationData(wafapp);

    await client
      .del(prefix + '/applications/' + application.id)
      .set('X-Auth-Token', ExpectedData.userToken)
      .set('tenant-id', ExpectedData.tenantId)
      .expect(204);
  });

  it(
    'post ' + prefix + '/applications/{id}/deploy: deploy application',
    async () => {
      let adc = await givenAdcData(wafapp);
      let application = await givenApplicationData(wafapp, {
        adcId: adc.id,
      });

      let response = await client
        .post(prefix + '/applications/' + application.id + '/declarations')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .send({name: 'a-declaration'})
        .expect(200);

      await client
        .patch(prefix + '/applications/' + application.id)
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .send({defaultDeclarationId: response.body.declaration.id})
        .expect(204);

      deployStub.returns(Promise.resolve('Hello'));

      await client
        .post(prefix + '/applications/' + application.id + '/deploy')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .expect(200);
    },
  );

  it(
    'post ' + prefix + '/applications/{id}/deploy: deploy without adcId',
    async () => {
      let application = await givenApplicationData(wafapp, {});

      await client
        .post(prefix + '/applications/' + application.id + '/deploy')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .expect(422);
    },
  );

  it(
    'post ' + prefix + '/applications/{id}/deploy: deploy without declaration',
    async () => {
      let adc = await givenAdcData(wafapp);

      let application = await givenApplicationData(wafapp, {
        adcId: adc.id,
      });

      deployStub.returns(Promise.resolve('Hello'));

      await client
        .post(prefix + '/applications/' + application.id + '/deploy')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .expect(422);
    },
  );

  it(
    'post ' + prefix + '/applications/{id}/cleanup: undeploy application',
    async () => {
      let adc = await givenAdcData(wafapp);
      let application = await givenApplicationData(wafapp, {
        adcId: adc.id,
      });

      deployStub.returns(Promise.resolve('Hello'));

      await client
        .post(prefix + '/applications/' + application.id + '/cleanup')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .expect(200);
    },
  );

  it(
    'post ' + prefix + '/applications/{id}/cleanup: undeploy without adcId',
    async () => {
      let application = await givenApplicationData(wafapp, {});

      await client
        .post(prefix + '/applications/' + application.id + '/cleanup')
        .set('X-Auth-Token', ExpectedData.userToken)
        .set('tenant-id', ExpectedData.tenantId)
        .expect(422);
    },
  );
});
