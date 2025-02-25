/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { environment } from 'src/environments/environment'
import { AuthService } from '../auth.service'

import { DevicesService } from './devices.service'

describe('DevicesService', () => {
  let service: DevicesService
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  const deviceRes = {
    hostname: 'localhost',
    icon: 1,
    connectionStatus: true,
    guid: 'defgh-34567-poiuy',
    tags: []
  }

  const deviceResponse = [deviceRes]

  const deviceListResponse = {
    data: deviceResponse,
    totalCount: 1
  }

  const error = {
    status: 404,
    message: 'Not Found'
  }

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'delete', 'patch'])
    TestBed.configureTestingModule({
      imports: [AuthService]
    })
    service = new DevicesService(httpClientSpy as any)
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should return all the tags', () => {
    const tagsResponse = ['test']
    httpClientSpy.get.and.returnValue(of(tagsResponse))
    service.getTags().subscribe(response => {
      expect(response).toEqual(tagsResponse)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/devices/tags`)
    })
  })

  it('should NOT return tags when error received', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getTags().subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return the requested device', () => {
    httpClientSpy.get.and.returnValue(of(deviceRes))
    service.getDevice(deviceRes.guid).subscribe(response => {
      expect(response).toEqual(deviceRes)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/devices/${deviceRes.guid}`)
    })
  })

  it('should NOT return requested device when error received', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getDevice('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return all devices', () => {
    httpClientSpy.get.and.returnValue(of(deviceListResponse))
    service.getDevices({ pageSize: 25, startsFrom: 0, count: 'true' }).subscribe(response => {
      expect(response).toEqual(deviceListResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/devices?$top=25&$skip=0&$count=true`)
  })

  it('should return all devices filtered by tags', () => {
    httpClientSpy.get.and.returnValue(of(deviceListResponse))
    service.getDevices({ pageSize: 25, startsFrom: 0, count: 'true', tags: ['test'] }).subscribe(response => {
      expect(response).toEqual(deviceListResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/devices?tags=test&$top=25&$skip=0&$count=true`)
  })

  it('should NOT return devices when error received', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getDevices({ pageSize: 25, startsFrom: 0, count: 'true' }).subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should set AMT Features', () => {
    const deviceResponse = {
      userConsent: 'kVM',
      optInState: 2,
      redirection: true,
      KVM: true,
      SOL: true,
      IDER: true
    }
    httpClientSpy.post.and.returnValue(of(deviceResponse))
    service.setAmtFeatures('defgh-34567-poiuy').subscribe(response => {
      expect(response).toEqual(deviceResponse)
      expect(httpClientSpy.post).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/features/defgh-34567-poiuy`, { userConsent: 'none', enableKVM: true, enableSOL: true, enableIDER: true })
    })
  })

  it('should return error when setting AMT Features', () => {
    httpClientSpy.post.and.returnValue(throwError(error))
    service.setAmtFeatures('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return power state', () => {
    const powerState = {
      powerstate: 2
    }
    httpClientSpy.get.and.returnValue(of(powerState))
    service.getPowerState('defgh-34567-poiuy').subscribe(response => {
      expect(response.powerstate).toBe(powerState.powerstate)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/power/state/defgh-34567-poiuy`)
    })
  })

  it('should return error when requesting power state', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getPowerState('defgh-34567-poiuy').subscribe(() => {}, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return device stats', () => {
    const deviceStats = {
      totalCount: 1,
      connectedCount: 1,
      disconnectedCount: 0
    }
    httpClientSpy.get.and.returnValue(of(deviceStats))
    service.getStats().subscribe(response => {
      expect(response).toEqual(deviceStats)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/devices/stats`)
    })
  })

  it('should return error when requesting device stats', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getStats().subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return user consent code', () => {
    const userConsentresponse = {
      Header: {
        To: 'string',
        RelatesTo: 'string',
        Action: 'string',
        MessageID: 'string',
        ResourceURI: 'string',
        Method: 'string'
      },
      Body: {
        ReturnValue: [{
          hostname: 'localhost',
          icon: 1,
          connectionStatus: true,
          guid: 'defgh-34567-poiuy',
          tags: []
        }],
        ReturnValueStr: 'SUCCESS'
      }
    }
    httpClientSpy.get.and.returnValue(of(userConsentresponse))
    service.reqUserConsentCode('defgh-34567-poiuy').subscribe(response => {
      expect(JSON.stringify(response)).toContain(JSON.stringify(userConsentresponse))
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/userConsentCode/defgh-34567-poiuy`)
    })
  })

  it('should return error when requesting for user consent code', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }
    httpClientSpy.get.and.returnValue(throwError(error))
    service.reqUserConsentCode('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return success when cancelling user consent code', () => {
    const cancelConsentresponse = {
      Header: {
        To: 'string',
        RelatesTo: 'string',
        Action: 'string',
        MessageID: 'string',
        ResourceURI: 'string',
        Method: 'string'
      },
      Body: {
        ReturnValue: [{
          hostname: 'localhost',
          icon: 1,
          connectionStatus: true,
          guid: 'defgh-34567-poiuy',
          tags: []
        }],
        ReturnValueStr: 'SUCCESS'
      }
    }
    httpClientSpy.get.and.returnValue(of(cancelConsentresponse))
    service.cancelUserConsentCode('defgh-34567-poiuy').subscribe(response => {
      expect(JSON.stringify(response)).toContain(JSON.stringify(cancelConsentresponse))
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/userConsentCode/cancel/defgh-34567-poiuy`)
    })
  })

  it('should return error when cancelling user consent code', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.cancelUserConsentCode('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return success when sending user consent code', () => {
    const sendUserConsentCode = {
      Header: {
        To: 'string',
        RelatesTo: 'string',
        Action: 'string',
        MessageID: 'string',
        ResourceURI: 'string',
        Method: 'string'
      },
      Body: {
        ReturnValue: [{
          hostname: 'localhost',
          icon: 1,
          connectionStatus: true,
          guid: 'defgh-34567-poiuy',
          tags: []
        }],
        ReturnValueStr: 'SUCCESS'
      }
    }
    httpClientSpy.post.and.returnValue(of(sendUserConsentCode))
    service.sendUserConsentCode('defgh-34567-poiuy', 2).subscribe(response => {
      expect(JSON.stringify(response)).toContain(JSON.stringify(sendUserConsentCode))
      expect(httpClientSpy.post).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/userConsentCode/defgh-34567-poiuy`, { consentCode: 2 })
    })
  })

  it('should return error when sending user consent code', () => {
    httpClientSpy.post.and.returnValue(throwError(error))
    service.sendUserConsentCode('defgh-34567-poiuy', 2).subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return AMT Version', () => {
    const amtVersion = {
      amtVersion: 2
    }
    httpClientSpy.get.and.returnValue(of(amtVersion))
    service.getAMTVersion('defgh-34567-poiuy').subscribe(response => {
      expect(response.amtVersion).toBe(amtVersion.amtVersion)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/version/defgh-34567-poiuy`)
    })
  })

  it('should return error when requesting power state', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getAMTVersion('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return Audit Log', () => {
    const auditLogResponse = {
      totalCnt: 1,
      records: [{
        AuditApp: 'string',
        AuditAppID: 1234,
        Event: 'logs',
        EventID: 12345,
        Ex: 'string',
        ExStr: 'string',
        Initiator: 'string',
        InitiatorType: 1234,
        MCLocationType: 1234,
        NetAddress: 'string',
        Time: 'string'
      }]
    }
    httpClientSpy.get.and.returnValue(of(auditLogResponse))
    service.getAuditLog('defgh-34567-poiuy').subscribe(response => {
      expect(response).toEqual(auditLogResponse)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/log/audit/defgh-34567-poiuy?startIndex=0`)
    })
  })

  it('should return error when requesting Audit Log', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getAuditLog('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return Event Log', () => {
    const eventLogResponse = [{
      DeviceAddress: 123456,
      EventSensorType: 45678,
      EventType: 45,
      EventOffset: 23,
      EventSourceType: 2,
      EventSeverity: 5,
      SensorNumber: 1,
      Entity: 1,
      EntityInstance: 2,
      EventData: [1, 2, 3, 4],
      Time: 'string',
      EntityStr: 'string',
      Desc: 'string',
      eventTypeDesc: 'string'
    }]
    httpClientSpy.get.and.returnValue(of(eventLogResponse))
    service.getEventLog('defgh-34567-poiuy').subscribe(response => {
      expect(response).toEqual(eventLogResponse)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/log/event/defgh-34567-poiuy`)
    })
  })

  it('should return error when requesting Event Log', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getEventLog('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return AMT Features', () => {
    const amtFeaturesResponse = {
      userConsent: 'KVM',
      optInState: 2,
      redirection: true,
      KVM: true,
      SOL: true,
      IDER: true
    }
    httpClientSpy.get.and.returnValue(of(amtFeaturesResponse))
    service.getAMTFeatures('defgh-34567-poiuy').subscribe(response => {
      expect(response).toEqual(amtFeaturesResponse)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/features/defgh-34567-poiuy`)
    })
  })

  it('should return error when requesting AMT Features', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getAMTFeatures('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should send power action < 100', () => {
    const sendPowerAction = {
      Header: {
        To: 'string',
        RelatesTo: 'string',
        Action: 'string',
        MessageID: 'string',
        ResourceURI: 'string',
        Method: 'string'
      },
      Body: {
        ReturnValue: [{
          hostname: 'localhost',
          icon: 1,
          connectionStatus: true,
          guid: 'defgh-34567-poiuy',
          tags: []
        }],
        ReturnValueStr: 'SUCCESS'
      }
    }
    httpClientSpy.post.and.returnValue(of(sendPowerAction))
    service.sendPowerAction('defgh-34567-poiuy', 2).subscribe(response => {
      expect(response).toEqual(sendPowerAction)
      expect(httpClientSpy.post).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/power/action/defgh-34567-poiuy`, { method: 'PowerAction', action: 2, useSOL: false })
    })
  })

  it('should send power action >= 100', () => {
    const sendPowerAction = {
      Header: {
        To: 'string',
        RelatesTo: 'string',
        Action: 'string',
        MessageID: 'string',
        ResourceURI: 'string',
        Method: 'string'
      },
      Body: {
        ReturnValue: [{
          hostname: 'localhost',
          icon: 1,
          connectionStatus: true,
          guid: 'defgh-34567-poiuy',
          tags: []
        }],
        ReturnValueStr: 'SUCCESS'
      }
    }
    httpClientSpy.post.and.returnValue(of(sendPowerAction))
    service.sendPowerAction('defgh-34567-poiuy', 101).subscribe(response => {
      expect(response).toEqual(sendPowerAction)
      expect(httpClientSpy.post).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/power/bootoptions/defgh-34567-poiuy`, { method: 'PowerAction', action: 101, useSOL: false })
    })
  })

  it('should return error when sending power action', () => {
    httpClientSpy.post.and.returnValue(throwError(error))
    service.sendPowerAction('defgh-34567-poiuy', 2).subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('it should return the hardware information', () => {
    const getHardwareInfo = {
      CIM_Chassis: {
        response: {
          ChassisPackageType: 2,
          CreationClassName: 'string',
          ElementName: 'string',
          Manufacturer: 'string',
          Model: 'string',
          OperationalStatus: 2,
          PackageType: 2,
          SerialNumber: 'string',
          Tag: 'string',
          Version: 'string'
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_Chip: {
        response: {
          CanBeFRUed: true,
          CreationClassName: 'string',
          ElementName: 'string',
          Manufacturer: 'string',
          OperationalStatus: 2,
          Tag: {},
          Version: 'string',
          BankLabel: 'string',
          MaxMemorySpeed: 2,
          MemoryType: 2,
          SerialNumber: 'string',
          PartNumber: 'string',
          Speed: 3
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_Card: {
        response: {
          CanBeFRUed: true,
          CreationClassName: 'string',
          ElementName: 'string',
          Manufacturer: 'string',
          Model: 'string',
          OperationalStatus: 2,
          PackageType: 2,
          SerialNumber: 'string',
          Tag: 'string',
          Version: 'string'
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_BIOSElement: {
        response: {
          ElementName: 'string',
          Manufacturer: 'string',
          Name: 'string',
          OperationalStatus: 2,
          PrimaryBIOS: true,
          ReleaseDate: {},
          SoftwareElementID: 'string',
          SoftwareElementState: 2,
          TargetOperatingSystem: 2,
          Version: 'string'
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_Processor: {
        response: {
          CPUStatus: 2,
          CreationClassName: 'string',
          CurrentClockSpeed: 2,
          DeviceID: 'string',
          ElementName: 'string',
          EnabledState: 2,
          ExternalBusClockSpeed: 2,
          Family: 2,
          HealthState: 2,
          MaxClockSpeed: 2,
          OperationalStatus: 2,
          RequestedState: 2,
          Role: 'string',
          Stepping: 2,
          SystemCreationClassName: 'string',
          SystemName: 'string',
          UpgradeMethod: 2
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_PhysicalMemory: {
        response: {
          BankLabel: 'string',
          Capacity: {},
          ConfiguredMemoryClockSpeed: 2,
          CreationClassName: 'string',
          ElementName: 'string',
          FormFactor: 2,
          IsSpeedInMhz: true,
          Manufacturer: 'string',
          MaxMemorySpeed: 2,
          MemoryType: 2,
          PartNumber: 'string',
          SerialNumber: 'string',
          Speed: 2,
          Tag: {}
        },
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_MediaAccessDevice: {
        response: [{
          Capabilities: [1, 2, 4],
          CreationClassName: 'string',
          DeviceID: 'string',
          ElementName: 'string',
          EnabledDefault: 2,
          EnabledState: 2,
          MaxMediaSize: 2,
          OperationalStatus: 2,
          RequestedState: 2,
          Security: 2,
          SystemCreationClassName: 'string',
          SystemName: 'string'
        }],
        responses: { message: 'SUCCESS' },
        status: 200
      },
      CIM_PhysicalPackage: {
        response: [{
          CanBeFRUed: true,
          CreationClassName: 'string',
          ElementName: 'string',
          Manufacturer: 'string',
          Model: 'string',
          OperationalStatus: 2,
          PackageType: 2,
          SerialNumber: 'string',
          Tag: 'string',
          Version: 'string',
          ManufactureDate: {},
          ChassisPackageType: 2
        }],
        responses: { message: 'SUCCESS' },
        status: 200
      }
    }

    httpClientSpy.get.and.returnValue(of(getHardwareInfo))
    service.getHardwareInformation('defgh-34567-poiuy').subscribe(response => {
      expect(response).toEqual(getHardwareInfo)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/amt/hardwareInfo/defgh-34567-poiuy`)
    })
  })

  it('should return error while getting hardware information', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getHardwareInformation('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })

  it('should return redirection token', () => {
    const redirectionToken = {
      token: '123'
    }
    httpClientSpy.get.and.returnValue(of(redirectionToken))
    service.getRedirectionExpirationToken('defgh-34567-poiuy').subscribe(result => {
      expect(result).toEqual(redirectionToken)
      expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.mpsServer}/api/v1/authorize/redirection/defgh-34567-poiuy`)
    })
  })
  it('should return error while getting redirection token', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getRedirectionExpirationToken('defgh-34567-poiuy').subscribe(null, err => {
      expect(error).toEqual(err)
    })
  })
})
