/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from './shared/shared.module'
import { CoreModule } from './core/core.module'
import { DevicesComponent } from './devices/devices.component'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { FlexLayoutModule } from '@angular/flex-layout'
import { DomainsComponent } from './domains/domains.component'
import { ProfilesComponent } from './profiles/profiles.component'
import { ConfigsComponent } from './configs/configs.component'
import { LoginComponent } from './login/login.component'
import { RouterModule } from '@angular/router'
import { DashboardComponent } from './dashboard/dashboard.component'
import { ProfileDetailComponent } from './profiles/profile-detail/profile-detail.component'
import { DomainDetailComponent } from './domains/domain-detail/domain-detail.component'
import { ConfigDetailComponent } from './configs/config-detail/config-detail.component'
import { DeviceDetailComponent } from './devices/device-detail/device-detail.component'
import { MomentModule } from 'ngx-moment'
import { KvmComponent } from './devices/kvm/kvm.component'
import { SolComponent } from './devices/sol/sol.component'
import { AuditLogComponent } from './devices/audit-log/audit-log.component'
import { DeviceToolbarComponent } from './devices/device-toolbar/device-toolbar.component'
import { AuthorizeInterceptor } from './authorize.interceptor'
import { WirelessComponent } from './wireless/wireless.component'
import { WirelessDetailComponent } from './wireless/wireless-detail/wireless-detail.component'
import { SolModule } from '@open-amt-cloud-toolkit/ui-toolkit-angular/sol'
import { KvmModule } from '@open-amt-cloud-toolkit/ui-toolkit-angular/kvm'
import { DeviceUserConsentComponent } from './devices/device-user-consent/device-user-consent.component'
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt'
import { EventLogComponent } from './devices/event-log/event-log.component'
import { EventChannelComponent } from './event-channel/event-channel.component'
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker'
import { IPublicClientApplication, PublicClientApplication, LogLevel } from '@azure/msal-browser'
import { MsalModule, MsalBroadcastService, MsalService, MSAL_INSTANCE, MsalRedirectComponent } from '@azure/msal-angular'
import { environment } from 'src/environments/environment'

// Does any of this run on IE anyway?  IE doesn't have includes() so have to use indexOf to test for it.
// eslint-disable-next-line @typescript-eslint/prefer-includes
const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1

export function loggerCallback (logLevel: LogLevel, message: string): void {
  console.log(message)
}

const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = { protocol: 'wss' }
export function MSALInstanceFactory (): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.mpsAzureClientId,
      authority: `https://login.microsoftonline.com/${environment.mpsAzureTenantId}`, // The Azure cloud instance and the app's sign-in audience (tenant ID, common, organizations, or consumers)
      redirectUri: environment.azureRedirectUri
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: isIE // Set to true for Internet Explorer 11
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
  })
}

@NgModule({
  declarations: [
    AppComponent,
    DevicesComponent,
    DomainsComponent,
    ProfilesComponent,
    ConfigsComponent,
    LoginComponent,
    DashboardComponent,
    ProfileDetailComponent,
    DomainDetailComponent,
    ConfigDetailComponent,
    DeviceDetailComponent,
    KvmComponent,
    SolComponent,
    AuditLogComponent,
    DeviceToolbarComponent,
    WirelessComponent,
    WirelessDetailComponent,
    DeviceUserConsentComponent,
    EventLogComponent,
    EventChannelComponent
  ],
  imports: [
    MomentModule,
    FlexLayoutModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CoreModule,
    BrowserAnimationsModule,
    SolModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    SharedModule.forRoot(),
    RouterModule.forRoot([
      {
        path: '',
        component: DashboardComponent
      },
      {
        path: 'login',
        component: LoginComponent
      }
    ]),
    KvmModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    NgxMatTimepickerModule,
    MsalModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthorizeInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    MsalService,
    MsalBroadcastService
  ],
  bootstrap: [
    AppComponent,
    MsalRedirectComponent
  ]
})
export class AppModule { }
