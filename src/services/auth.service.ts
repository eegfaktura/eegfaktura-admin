import {UserManager} from "oidc-client-ts";

export class AuthService extends UserManager {

  public async getToken() {
    const user = await this.getUser()
    if (user && user.expires_in) {
      const expiresIn = user.expires_in
      console.log(`getToken(): Expires in: ${expiresIn}`)
      if (expiresIn < 30) {
        return this.signinSilent().then(user => {
          if (user) {
            return user.access_token
          }
          throw new Error("Token expired")
        })
        // return user.access_token
      }
      return user.access_token
    }
    throw new Error("Not authorized")
  }

  public async login() {
    return this.signinRedirect()
  }

  public async logout() {
    return this.signoutRedirect()
  }
}