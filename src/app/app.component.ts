/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { NavigationStart, Router } from '@angular/router'
import { AuthService } from './auth.service'
import { MQTTService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoggedIn = false

  constructor (public router: Router, public authService: AuthService, public mqttService: MQTTService
  ) {
    this.mqttService.connect()
    this.mqttService.subscribeToTopic('mps/#')
    this.mqttService.subscribeToTopic('rps/#')
  }

  ngOnInit (): void {
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
    })
  }

  ngAfterViewInit (): void {
    this.router.events.subscribe(val => {
      this.isLoggedIn = this.authService.isLoggedIn
      if (val instanceof NavigationStart) {
        // if not logged in
        if (!this.isLoggedIn && val.url !== '/login') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate(['login'])
        }
      }
    })
  }

  ngOnDestroy (): void {
    this.mqttService?.destroy()
  }
}
