/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from 'src/app/auth.service'
import { AboutComponent } from '../about/about.component'

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  isLoggedIn = false
  username: string = ''

  constructor (public dialog: MatDialog, public authService: AuthService) {
  }

  ngOnInit (): void {
    // Subscribe for changes in state of authService
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
      this.username = this.authService.username
    })
    // Get current state of authService - if we are already logged in,
    // the loggedInSubject event has already been emitted and we won't see it.
    this.isLoggedIn = this.authService.isLoggedIn
    this.username = this.authService.username
  }

  logout (): void {
    this.username = ''
    this.authService.logout()
  }

  displayAbout (): void {
    this.dialog.open(AboutComponent)
  }
}
