/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { Router } from '@angular/router'
import { ValidatorError } from 'src/models/models'
import { MsalService } from '@azure/msal-angular'
import { AuthenticationResult } from '@azure/msal-common'

interface LoggedInUser {
  token: string
  username: string
  isAzure: boolean
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedInSubject: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  isLoggedIn = false
  url: string = `${environment.mpsServer}/api/v1/authorize`
  isAzure: boolean = false
  username: string = ''

  constructor (
    private readonly http: HttpClient,
    public router: Router,
    private readonly azureService: MsalService
  ) {
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.url = `${environment.mpsServer}/login/api/v1/authorize`
    }
    const data = localStorage.getItem('loggedInUser')
    if (data != null) {
      const loggedInUser = JSON.parse(data)
      this.isAzure = loggedInUser.isAzure
      this.username = loggedInUser.username
      this.isLoggedIn = true
    }
  }

  getLoggedUserToken (): string {
    const loggedUser: any = localStorage.getItem('loggedInUser')
    const token: string = JSON.parse(loggedUser).token
    return token
  }

  login (username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password })
      .pipe(
        map((data: any) => {
          this.isLoggedIn = true
          if (!this.isAzure) this.username = username
          data.username = this.username
          localStorage.setItem('loggedInUser', JSON.stringify(data))
          this.loggedInSubject.next(this.isLoggedIn)
        }),
        catchError((err: any) => {
          throw err
        })
      )
  }

  loginAzure (): Observable<any> {
    return this.azureService.loginPopup()
      .pipe(
        switchMap((result: AuthenticationResult) => {
          this.username = ''
          if (result.account) {
            this.username = `${result.account.name ?? ''} (${result.account.username})`
          }
          this.isAzure = true
          // Pass the Azure access token to MPS to get an OpenAMT JWT...
          // For now, use the magic username of 'AzureAD' and the access token as the password.
          // (`AzureAD/${result.account.localAccountId}` might be better for username)
          // This avoids adding a new API for this token exchange!
          return this.login('AzureAD', result.accessToken)
        }),
        catchError((err: any) => {
          this.isAzure = false
          throw err
        })
      )
  }

  logout (): void {
    this.isLoggedIn = false
    this.loggedInSubject.next(this.isLoggedIn)
    localStorage.removeItem('loggedInUser')
    if (this.isAzure) {
      this.isAzure = false
      this.azureService.logoutPopup({
        mainWindowRedirectUri: '/login'
      })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(['/login'])
  }

  onError (err: any): string[] {
    const errorMessages: string[] = []
    if (err.error?.errors != null) {
      err.error.errors.forEach((error: ValidatorError) => {
        errorMessages.push(`${error.msg}: ${error.param}`)
      })
    } else if (err.error?.message != null) {
      errorMessages.push(err.error.message)
    } else {
      errorMessages.push(err)
    }
    return errorMessages
  }
}
