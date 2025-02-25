/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, OnDestroy } from '@angular/core'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { Observable, of, throwError } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { environment } from 'src/environments/environment'
import { AmtFeaturesResponse, PowerState, userConsentData, userConsentResponse } from 'src/models/models'
import { DeviceUserConsentComponent } from '../device-user-consent/device-user-consent.component'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SolComponent implements OnInit, OnDestroy {
  results: any
  amtFeatures?: AmtFeaturesResponse
  isLoading: boolean = false
  deviceId: string = ''
  powerState: PowerState = { powerstate: 0 }
  readyToLoadSol: boolean = false
  mpsServer: string = `${environment.mpsServer.replace('http', 'ws')}/relay`
  authToken: string = ''
  isDisconnecting: boolean = false
  @Input() deviceState: number = 0
  @Output() deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)
  constructor (private readonly activatedRoute: ActivatedRoute,
    private readonly devicesService: DevicesService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private readonly router: Router) {
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isDisconnecting = true
      }
    })
  }

  ngOnDestroy (): void {
    this.isDisconnecting = true
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
    })
    this.devicesService.startwebSocket.subscribe((data: boolean) => {
      this.isLoading = true
      this.setAmtFeatures()
      this.deviceConnection.emit(true)
    })
    this.devicesService.stopwebSocket.subscribe((data: boolean) => {
      this.isDisconnecting = true
      this.deviceConnection.emit(false)
    })
    this.devicesService.getRedirectionExpirationToken(this.deviceId).subscribe((result) => {
      this.authToken = result.token
    })
    this.setAmtFeatures()
  }

  init (): void {
    this.getPowerState(this.deviceId).subscribe(data => {
      this.powerState = data as PowerState
      if (this.powerState.powerstate !== 2) {
        // If device not power on, shows alert to power up device
        this.isLoading = false
        const dialog = this.dialog.open(PowerUpAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.isLoading = true
            this.devicesService.sendPowerAction(this.deviceId, 2).pipe().subscribe(data => {
              this.getAMTFeatures()
            })
          }
        })
      } else {
        this.getAMTFeatures()
      }
    })
  }

  setAmtFeatures (): void {
    this.devicesService.setAmtFeatures(this.deviceId)
      .pipe(catchError((err) => {
        this.snackBar.open($localize`Unable to change user consent - code required for SOL in CCM`, undefined, SnackbarDefaults.defaultWarn)
        return throwError(err)
      }), finalize(() => {
        this.init()
      })).subscribe()
  }

  getPowerState (guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading = false
        this.snackBar.open($localize`Error retrieving power status`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
    )
  }

  getAMTFeatures (): void {
    this.isLoading = true
    this.devicesService.getAMTFeatures(this.deviceId).subscribe(results => {
      this.amtFeatures = results
      this.checkUserConsent()
    }, err => {
      this.isLoading = false
      this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
      return throwError(err)
    })
  }

  checkUserConsent (): void {
    if (this.amtFeatures && (this.amtFeatures.userConsent === 'none' || this.amtFeatures.userConsent === 'kvm')) {
      this.readyToLoadSol = true
    } else {
      if (this.amtFeatures?.optInState === 2) {
        // 2-DISPLAYED: the user consent code was displayed to the user.
        this.userConsentDialog()
      } else if (this.amtFeatures?.optInState !== 3 && this.amtFeatures?.optInState !== 4) {
        this.reqUserConsentCode(this.deviceId).subscribe((data: userConsentResponse) => {
          if (data.Body?.ReturnValue === 0) {
            //  If OptIn is All user consent is required
            //  3 - RECEIVED: user consent code was successfully entered by the IT operator.
            //  4 - IN SESSION: There is a Storage Redirection or KVM session open.
            this.userConsentDialog()
          } else {
            this.isLoading = false
            this.snackBar.open($localize`SOL cannot be accessed - failed to request user consent code`, undefined, SnackbarDefaults.defaultError)
          }
        })
      } else if (this.amtFeatures?.optInState === 3 || this.amtFeatures?.optInState === 4) {
        this.readyToLoadSol = true
      }
    }
  }

  userConsentDialog (): void {
    // Open user consent dialog
    const userConsentDialog = this.dialog.open(DeviceUserConsentComponent, {
      height: '300px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })
    userConsentDialog.afterClosed().subscribe(data => {
      if (data == null) {
        // if clicked outside the dialog, call to cancel previous requested user consent code
        this.cancelUserConsentCode(this.deviceId)
      } else {
        this.afterUserContentDialogClosed(data)
      }
    })
  }

  afterUserContentDialogClosed (data: userConsentData): void {
    const response: userConsentResponse = data?.results
    // On success to send or cancel to previous requested user consent code
    const method = response.Header.Action.substring(response.Header.Action.lastIndexOf('/') + 1, response.Header.Action.length)
    if (method === 'CancelOptInResponse') {
      this.cancelOptInCodeResponse(response)
    } else if (method === 'SendOptInCodeResponse') {
      this.SendOptInCodeResponse(response)
    }
  }

  cancelOptInCodeResponse (result: userConsentResponse): void {
    this.isLoading = false
    if (result.Body?.ReturnValue === 0) {
      this.snackBar.open($localize`SOL cannot be accessed - requested user consent code is cancelled`, undefined, SnackbarDefaults.defaultError)
    } else {
      this.snackBar.open($localize`SOL cannot be accessed - failed to cancel requested user consent code`, undefined, SnackbarDefaults.defaultError)
    }
  }

  SendOptInCodeResponse (result: userConsentResponse): void {
    if (result.Body?.ReturnValue === 0) {
      this.readyToLoadSol = true
    } else if (result.Body?.ReturnValue === 2066) {
      // On receiving an invalid consent code. Sending multiple invalid consent codes will cause the OptInState to return to NOT STARTED
      this.snackBar.open($localize`SOL cannot be accessed - unsupported user consent code`, undefined, SnackbarDefaults.defaultError)
      this.getAMTFeatures()
    } else {
      this.isLoading = false
      this.snackBar.open($localize`SOL cannot be accessed - failed to send user consent code`, undefined, SnackbarDefaults.defaultError)
    }
  }

  reqUserConsentCode (guid: string): Observable<userConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(catchError((err) => {
      // Cannot access SOL if request to user consent code fails
      this.isLoading = false
      this.snackBar.open($localize`Error requesting user consent code - retry after 3 minutes`, undefined, SnackbarDefaults.defaultError)
      return of(err)
    }))
  }

  cancelUserConsentCode (guid: string): void {
    this.devicesService.cancelUserConsentCode(guid)
      .pipe(catchError((err) => {
        this.snackBar.open($localize`Error cancelling user consent code`, undefined, SnackbarDefaults.defaultError)
        return of(err)
      }), finalize(() => {
        this.isLoading = false
      })).subscribe((data: userConsentResponse) => {
        if (data.Body?.ReturnValue === 0) {
          this.snackBar.open($localize`SOL cannot be accessed - previously requested user consent code is cancelled`, undefined, SnackbarDefaults.defaultWarn)
        } else {
          this.snackBar.open($localize`SOL cannot be accessed - failed to cancel previous requested user content code`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  deviceStatus (event: any): void {
    this.deviceState = event
    if (event === 3) {
      this.isLoading = false
    } else if (event === 0) {
      this.isLoading = false
      if (!this.isDisconnecting) {
        this.snackBar.open('Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.', undefined, SnackbarDefaults.defaultError)
      }
      this.isDisconnecting = false
    }
  }

  stopSol (): void {
    this.deviceConnection.emit(false)
  }
}
